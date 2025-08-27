# MemoryLane - AI-Powered Personal Timeline Builder

MemoryLane is a web application that helps you organize and rediscover your personal photos and videos by automatically creating beautiful timelines with AI-powered analysis.

## 🌟 Features

### Core Functionality
- **Smart Photo Upload**: Drag & drop or browse to upload photos and videos
- **EXIF Data Extraction**: Automatically extracts date, location, camera info from photos
- **Timeline Generation**: Creates chronological timelines organized by time periods
- **Memory Gallery**: Browse all your memories in a beautiful grid layout
- **Modal Preview**: Click any photo for full-size preview with metadata
- **Export Capabilities**: Generate shareable static websites (more formats coming)

### AI-Powered Analysis (Planned)
- Face recognition and clustering
- Object and scene detection
- Location mapping from GPS data
- Memory rediscovery suggestions
- Relationship timeline tracking

## 🚀 How to Use

### Access the App
- **Web Interface**: http://localhost:3000/site/memorylane/
- **API Base**: http://localhost:3000/app/memorylane/

### Getting Started
1. **Upload**: Navigate to the Upload tab and drag/drop photos or videos
2. **Timeline**: Check the Timeline tab to see your memories organized chronologically
3. **Memories**: Browse all uploaded content in the Memories tab
4. **Export**: Create shareable versions of your timeline

### Supported File Types
- **Images**: JPEG, JPG, PNG, GIF
- **Videos**: MP4, MOV, AVI
- **File Size Limit**: 50MB per file, up to 10 files at once

## 🔧 Technical Details

### File Structure
```
memorylane/
├── public/                # Frontend (static files)
│   ├── index.html        # Main UI
│   ├── css/style.css     # Styling
│   └── js/app.js         # Frontend JavaScript
├── data/                 # Private data storage
│   ├── uploads/          # Uploaded photos/videos
│   └── metadata.json     # File metadata and EXIF data
└── app.js               # Express backend API
```

### API Endpoints
- `GET /api/memories` - List all uploaded memories
- `POST /api/upload` - Upload new photos/videos
- `GET /api/timeline` - Generate timeline view
- `GET /api/file/:filename` - Serve uploaded files
- `DELETE /api/memories/:id` - Delete a memory
- `POST /api/export` - Export timeline (coming soon)

### Data Storage
- Files stored in `data/uploads/` with timestamp prefixes
- Metadata stored in `data/metadata.json` including EXIF data
- No external database required - all data is file-based

## 💡 Business Potential

### Target Markets
- **Personal Users**: Organize family photos and create memory books
- **Photographers**: Client gallery management and timeline creation
- **Genealogy Services**: Family history visualization
- **Event Planners**: Wedding/event memory packaging

### Revenue Opportunities
- Freemium model (basic free, advanced AI features paid)
- Premium export formats (video montages, printed books)
- White-label licensing for businesses
- Family/team collaboration plans

### Competitive Advantages
- **Privacy-first**: All processing happens locally, data never leaves your server
- **AI-powered storytelling**: Not just storage, but narrative creation
- **Cross-platform aggregation**: Potential to pull from multiple sources
- **Emotional intelligence**: Understanding relationships and life events

## 🚀 Deployment Options

### Current Setup (Development)
Your files are currently served from your local Docker container at:
- Frontend: http://localhost:3000/site/memorylane/
- Backend: http://localhost:3000/app/memorylane/

### Cheap Hosting Options for Production

1. **DigitalOcean Droplet** ($4-6/month)
   - 1GB RAM, 25GB SSD
   - Perfect for Node.js apps
   - Easy Docker deployment

2. **Vultr Cloud Compute** ($3.50-6/month)
   - Similar specs to DigitalOcean
   - Global data centers

3. **Linode Nanode** ($5/month)
   - 1GB RAM, 25GB storage
   - Excellent documentation

4. **AWS Lightsail** ($5/month)
   - Integrated with AWS ecosystem
   - Easy scaling options

5. **Railway** ($0-5/month)
   - Free tier available
   - Git-based deployment
   - Built-in PostgreSQL if needed

### Production Deployment Steps
1. Choose a VPS provider
2. Set up Docker/Docker Compose
3. Configure domain and SSL certificates
4. Set up backup for `data/` folder
5. Configure monitoring and logs

## 🔒 Security & Privacy

### Current Security Features
- File upload validation (type and size limits)
- Path traversal protection
- Filename sanitization
- Private data folder (not web-accessible)

### Production Security Recommendations
- Use HTTPS (Let's Encrypt)
- Regular backups of `data/` folder
- Rate limiting on upload endpoints
- User authentication for multi-user setups

## 🎯 Next Steps & Roadmap

### Immediate (MVP)
- [x] Photo/video upload with EXIF extraction
- [x] Timeline generation by date
- [x] Memory gallery with metadata
- [x] Basic export framework

### Short Term
- [ ] AI image analysis integration
- [ ] Advanced timeline filtering
- [ ] Export to PDF/video formats
- [ ] User authentication system

### Long Term
- [ ] Face recognition and clustering
- [ ] Social media import (Instagram, Facebook)
- [ ] Collaborative family timelines
- [ ] Mobile app companion

## 📁 Data Backup

Your memories are stored in:
- `sites/memorylane/data/uploads/` - All uploaded files
- `sites/memorylane/data/metadata.json` - Metadata and EXIF data

**Backup regularly** - this contains all your uploaded photos and videos!

## 🤝 Contributing

This is a proof-of-concept with significant commercial potential. Areas for improvement:
- AI/ML integration for better analysis
- User interface enhancements
- Performance optimizations
- Additional export formats
- Mobile responsiveness improvements

---

**Created**: August 26, 2025  
**Status**: MVP Complete, Ready for Testing and Enhancement
