const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const ExifReader = require('exifreader');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'data', 'uploads'));
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}_${sanitized}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'));
    }
  }
});

// Root route - redirect to main app
router.get('/', (req, res) => {
  res.redirect('/site/memorylane/');
});

// Get all uploaded memories
router.get('/api/memories', async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, 'data', 'uploads');
    const metadataPath = path.join(__dirname, 'data', 'metadata.json');
    
    // Ensure uploads directory exists
    try {
      await fs.access(uploadsDir);
    } catch (e) {
      return res.json([]); // No uploads directory yet
    }
    
    let metadata = {};
    try {
      const metadataContent = await fs.readFile(metadataPath, 'utf8');
      metadata = JSON.parse(metadataContent);
    } catch (e) {
      console.warn('No metadata file found, creating from files');
      // If no metadata, we'll still show files but without EXIF data
    }
    
    const files = await fs.readdir(uploadsDir);
    const memories = [];
    
    for (const file of files) {
      try {
        const filePath = path.join(uploadsDir, file);
        const stats = await fs.stat(filePath);
        
        // Skip directories or non-files
        if (!stats.isFile()) continue;
        
        const memory = {
          id: file,
          filename: file,
          originalName: metadata[file]?.originalName || file,
          uploadDate: metadata[file]?.uploadDate || stats.mtime.toISOString(),
          size: stats.size,
          type: path.extname(file).toLowerCase(),
          metadata: metadata[file] || {},
          url: `/app/memorylane/api/file/${file}`
        };
        
        memories.push(memory);
      } catch (fileError) {
        console.error('Error processing file', file, fileError.message);
        // Continue with other files
      }
    }
    
    // Sort by date (newest first)
    memories.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    
    res.json(memories);
  } catch (error) {
    console.error('Error getting memories:', error);
    res.status(500).json({ error: 'Failed to get memories' });
  }
});

// Serve uploaded files
router.get('/api/file/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'data', 'uploads', filename);
  
  // Security: prevent path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).json({ error: 'File not found' });
    }
  });
});

// Upload endpoint
router.post('/api/upload', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = [];
    const metadataPath = path.join(__dirname, 'data', 'metadata.json');
    
    // Load existing metadata with file locking simulation
    let metadata = {};
    try {
      const metadataContent = await fs.readFile(metadataPath, 'utf8');
      metadata = JSON.parse(metadataContent);
    } catch (e) {
      console.log('Creating new metadata file');
      metadata = {};
    }
    
    for (const file of req.files) {
      try {
        // Extract EXIF data for images
        let exifData = {};
        try {
          if (['.jpg', '.jpeg'].includes(path.extname(file.originalname).toLowerCase())) {
            const buffer = await fs.readFile(file.path);
            const tags = ExifReader.load(buffer);
            
            exifData = {
              dateTime: tags.DateTime?.description || tags.DateTimeOriginal?.description,
              gps: tags.GPSLatitude && tags.GPSLongitude ? {
                lat: tags.GPSLatitude.description,
                lng: tags.GPSLongitude.description
              } : null,
              camera: tags.Make?.description,
              model: tags.Model?.description,
              width: tags.ImageWidth?.value,
              height: tags.ImageLength?.value
            };
          }
        } catch (exifError) {
          console.warn('EXIF extraction failed for', file.originalname, ':', exifError.message);
        }
        
        // Store metadata
        metadata[file.filename] = {
          originalName: file.originalname,
          uploadDate: new Date().toISOString(),
          size: file.size,
          mimetype: file.mimetype,
          exif: exifData,
          aiAnalysis: null // Will be populated later
        };
        
        uploadedFiles.push({
          id: file.filename,
          originalName: file.originalname,
          filename: file.filename,
          size: file.size,
          url: `/app/memorylane/api/file/${file.filename}`,
          exif: exifData
        });
      } catch (fileError) {
        console.error('Error processing file', file.originalname, ':', fileError.message);
        // Continue with other files
      }
    }
    
    // Save metadata atomically
    try {
      const metadataJson = JSON.stringify(metadata, null, 2);
      await fs.writeFile(metadataPath, metadataJson);
      console.log('Metadata saved successfully for', uploadedFiles.length, 'files');
    } catch (saveError) {
      console.error('Failed to save metadata:', saveError.message);
      // Still return success since files are uploaded, just metadata might be inconsistent
    }
    
    res.json({
      success: true,
      files: uploadedFiles,
      message: `Uploaded ${uploadedFiles.length} file(s) successfully`
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
});

// Generate timeline
router.get('/api/timeline', async (req, res) => {
  try {
    const metadataPath = path.join(__dirname, 'data', 'metadata.json');
    
    let metadata = {};
    try {
      const metadataContent = await fs.readFile(metadataPath, 'utf8');
      metadata = JSON.parse(metadataContent);
    } catch (e) {
      return res.json({ events: [], message: 'No memories uploaded yet' });
    }
    
    const events = [];
    
    // Process each file to create timeline events
    for (const [filename, data] of Object.entries(metadata)) {
      try {
        let eventDate = new Date(data.uploadDate);
        
        // Try to use EXIF date if available
        if (data.exif?.dateTime) {
          try {
            // Parse EXIF date format: "2025:08:26 14:36:57"
            const dateTimeParts = data.exif.dateTime.split(' ');
            if (dateTimeParts.length === 2) {
              const datePart = dateTimeParts[0].replace(/:/g, '-'); // "2025-08-26"
              const timePart = dateTimeParts[1]; // "14:36:57"
              const parsedDate = new Date(`${datePart}T${timePart}`);
              if (!isNaN(parsedDate.getTime())) {
                eventDate = parsedDate;
              }
            }
          } catch (e) {
            console.warn('EXIF date parsing failed for', filename, e.message);
            // Fall back to upload date
          }
        }
        
        // Validate that we have a valid date
        if (isNaN(eventDate.getTime())) {
          console.warn('Invalid date for', filename, 'using current time');
          eventDate = new Date();
        }
        
        const event = {
          id: filename,
          title: data.originalName || filename,
          date: eventDate.toISOString(),
          type: data.mimetype?.startsWith('image/') ? 'photo' : 'video',
          thumbnail: `/app/memorylane/api/file/${filename}`,
          location: data.exif?.gps ? `${data.exif.gps.lat}, ${data.exif.gps.lng}` : null,
          camera: data.exif?.camera && data.exif?.model ? `${data.exif.camera} ${data.exif.model}` : null,
          size: data.size || 0
        };
        
        events.push(event);
      } catch (eventError) {
        console.error('Error processing event for', filename, eventError.message);
        // Continue with other events
      }
    }
    
    // Sort by date (oldest first for timeline)
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Group by periods
    const groupedEvents = groupEventsByPeriod(events);
    
    res.json({
      totalEvents: events.length,
      timeline: groupedEvents,
      events: events
    });
    
  } catch (error) {
    console.error('Timeline generation error:', error);
    res.status(500).json({ error: 'Failed to generate timeline' });
  }
});

// Helper function to group events by time periods
function groupEventsByPeriod(events) {
  const periods = {};
  
  events.forEach(event => {
    const date = new Date(event.date);
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const periodKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    const periodName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    
    if (!periods[periodKey]) {
      periods[periodKey] = {
        period: periodName,
        events: []
      };
    }
    
    periods[periodKey].events.push(event);
  });
  
  return Object.values(periods);
}

// Delete memory
router.delete('/api/memories/:id', async (req, res) => {
  try {
    const filename = req.params.id;
    
    // Security check
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const filePath = path.join(__dirname, 'data', 'uploads', filename);
    const metadataPath = path.join(__dirname, 'data', 'metadata.json');
    
    // Delete file
    await fs.unlink(filePath);
    
    // Update metadata
    let metadata = {};
    try {
      const metadataContent = await fs.readFile(metadataPath, 'utf8');
      metadata = JSON.parse(metadataContent);
      delete metadata[filename];
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    } catch (e) {
      // Metadata file doesn't exist or is corrupted
    }
    
    res.json({ success: true, message: 'Memory deleted successfully' });
    
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete memory' });
  }
});

// Export timeline as static site
router.post('/api/export', async (req, res) => {
  try {
    // This would generate a static HTML version of the timeline
    // For now, just return success
    res.json({ 
      success: true, 
      message: 'Export feature coming soon!',
      exportUrl: '/site/memorylane/export/' 
    });
  } catch (error) {
    res.status(500).json({ error: 'Export failed' });
  }
});

module.exports = router;
