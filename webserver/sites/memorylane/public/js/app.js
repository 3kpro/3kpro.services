// MemoryLane Frontend JavaScript

class MemoryLane {
    constructor() {
        this.currentTab = 'upload';
        this.memories = [];
        this.timeline = [];
        
        this.initializeEventListeners();
        this.initializeUpload();
        this.loadMemories();
    }

    initializeEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Upload box click
        document.getElementById('uploadBox').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        // File input change
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files);
        });
    }

    initializeUpload() {
        const uploadBox = document.getElementById('uploadBox');
        
        // Drag and drop
        uploadBox.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadBox.style.borderColor = '#764ba2';
            uploadBox.style.background = 'rgba(118, 75, 162, 0.15)';
        });

        uploadBox.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadBox.style.borderColor = '#667eea';
            uploadBox.style.background = 'rgba(102, 126, 234, 0.05)';
        });

        uploadBox.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadBox.style.borderColor = '#667eea';
            uploadBox.style.background = 'rgba(102, 126, 234, 0.05)';
            
            const files = Array.from(e.dataTransfer.files);
            this.handleFileSelect(files);
        });
    }

    switchTab(tabName) {
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.currentTab = tabName;

        // Load data for specific tabs
        if (tabName === 'timeline') {
            this.loadTimeline();
        } else if (tabName === 'memories') {
            this.loadMemories();
        }
    }

    async handleFileSelect(files) {
        if (files.length === 0) return;

        const formData = new FormData();
        
        // Add files to form data
        Array.from(files).forEach(file => {
            formData.append('files', file);
        });

        // Show progress
        this.showUploadProgress();

        try {
            console.log('Uploading', files.length, 'files...');
            
            const response = await fetch('/app/memorylane/api/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            console.log('Upload response:', result);

            if (!response.ok) {
                throw new Error(result.error || `Upload failed with status ${response.status}`);
            }

            if (result.success) {
                this.showUploadResults(result);
                
                // Refresh with a delay to ensure backend processing is complete
                setTimeout(() => {
                    this.loadMemories(); // Refresh memories
                    this.loadTimeline(); // Refresh timeline
                }, 500);
            } else {
                throw new Error(result.error || 'Upload failed with unknown error');
            }

        } catch (error) {
            console.error('Upload error:', error);
            this.showUploadError(error.message);
        } finally {
            this.hideUploadProgress();
            
            // Clear file input
            const fileInput = document.getElementById('fileInput');
            if (fileInput) {
                fileInput.value = '';
            }
        }
    }

    showUploadProgress() {
        document.getElementById('uploadProgress').style.display = 'block';
        document.getElementById('progressFill').style.width = '0%';
        
        // Simulate progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            document.getElementById('progressFill').style.width = progress + '%';
            document.getElementById('progressText').textContent = 
                progress < 100 ? `Uploading... ${Math.round(progress)}%` : 'Processing...';
        }, 200);
    }

    hideUploadProgress() {
        setTimeout(() => {
            document.getElementById('uploadProgress').style.display = 'none';
        }, 500);
    }

    showUploadResults(result) {
        const resultsDiv = document.getElementById('uploadResults');
        
        resultsDiv.innerHTML = `
            <div class="upload-success">
                <i class="fas fa-check-circle"></i>
                <h3>Upload Successful!</h3>
                <p>${result.message}</p>
                <div class="uploaded-files">
                    ${result.files.map(file => `
                        <div class="uploaded-file">
                            <img src="${file.url}" alt="${file.originalName}" />
                            <p>${file.originalName}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Auto-hide after 5 seconds
        setTimeout(() => {
            resultsDiv.innerHTML = '';
        }, 5000);
    }

    showUploadError(message) {
        const resultsDiv = document.getElementById('uploadResults');
        
        resultsDiv.innerHTML = `
            <div class="upload-error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Upload Failed</h3>
                <p>${message}</p>
            </div>
        `;

        setTimeout(() => {
            resultsDiv.innerHTML = '';
        }, 5000);
    }

    async loadMemories() {
        const memoriesGrid = document.getElementById('memoriesGrid');
        memoriesGrid.innerHTML = '<div class="loading">Loading memories...</div>';

        try {
            const response = await fetch('/app/memorylane/api/memories');
            const memories = await response.json();

            this.memories = memories;

            if (memories.length === 0) {
                memoriesGrid.innerHTML = `
                    <div class="no-memories">
                        <i class="fas fa-images"></i>
                        <h3>No memories yet</h3>
                        <p>Upload some photos and videos to get started!</p>
                    </div>
                `;
                return;
            }

            memoriesGrid.innerHTML = memories.map(memory => `
                <div class="memory-card" onclick="showMemoryModal('${memory.id}')">
                    <img src="${memory.url}" alt="${memory.originalName}" loading="lazy" />
                    <div class="memory-card-info">
                        <h3>${memory.originalName}</h3>
                        <p><i class="fas fa-calendar"></i> ${new Date(memory.uploadDate).toLocaleDateString()}</p>
                        <p><i class="fas fa-file"></i> ${this.formatFileSize(memory.size)}</p>
                        ${memory.metadata.exif?.camera ? `<p><i class="fas fa-camera"></i> ${memory.metadata.exif.camera} ${memory.metadata.exif.model || ''}</p>` : ''}
                        <div class="memory-actions" onclick="event.stopPropagation()">
                            <button class="btn-delete" onclick="deleteMemory('${memory.id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading memories:', error);
            memoriesGrid.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error loading memories</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    async loadTimeline() {
        const timelineContainer = document.getElementById('timelineContainer');
        timelineContainer.innerHTML = '<div class="loading">Generating timeline...</div>';

        try {
            const response = await fetch('/app/memorylane/api/timeline');
            const timelineData = await response.json();

            this.timeline = timelineData;

            if (!timelineData.timeline || timelineData.timeline.length === 0) {
                timelineContainer.innerHTML = `
                    <div class="no-timeline">
                        <i class="fas fa-clock"></i>
                        <h3>No timeline yet</h3>
                        <p>Upload some photos and videos to create your memory timeline!</p>
                    </div>
                `;
                return;
            }

            timelineContainer.innerHTML = `
                <div class="timeline-stats">
                    <p><strong>${timelineData.totalEvents}</strong> memories across <strong>${timelineData.timeline.length}</strong> time periods</p>
                </div>
                ${timelineData.timeline.map(period => `
                    <div class="timeline-period">
                        <h3>${period.period}</h3>
                        <div class="timeline-events">
                            ${period.events.map(event => `
                                <div class="timeline-event" onclick="showMemoryModal('${event.id}')">
                                    <img src="${event.thumbnail}" alt="${event.title}" loading="lazy" />
                                    <div class="timeline-event-info">
                                        <h4>${event.title}</h4>
                                        <p><i class="fas fa-calendar"></i> ${new Date(event.date).toLocaleDateString()}</p>
                                        ${event.location ? `<p><i class="fas fa-map-marker-alt"></i> ${event.location}</p>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            `;

        } catch (error) {
            console.error('Error loading timeline:', error);
            timelineContainer.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error generating timeline</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Global functions for HTML onclick handlers
window.showMemoryModal = function(memoryId) {
    const memory = app.memories.find(m => m.id === memoryId);
    if (!memory) return;

    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalInfo = document.getElementById('modalInfo');

    modalImage.src = memory.url;
    modalInfo.innerHTML = `
        <h3>${memory.originalName}</h3>
        <p><strong>Uploaded:</strong> ${new Date(memory.uploadDate).toLocaleString()}</p>
        <p><strong>Size:</strong> ${app.formatFileSize(memory.size)}</p>
        ${memory.metadata.exif?.camera ? `<p><strong>Camera:</strong> ${memory.metadata.exif.camera} ${memory.metadata.exif.model || ''}</p>` : ''}
        ${memory.metadata.exif?.dateTime ? `<p><strong>Taken:</strong> ${memory.metadata.exif.dateTime}</p>` : ''}
        ${memory.metadata.exif?.gps ? `<p><strong>Location:</strong> ${memory.metadata.exif.gps.lat}, ${memory.metadata.exif.gps.lng}</p>` : ''}
    `;

    modal.style.display = 'block';
};

window.closeModal = function() {
    document.getElementById('imageModal').style.display = 'none';
};

window.deleteMemory = async function(memoryId) {
    if (!confirm('Are you sure you want to delete this memory?')) return;

    try {
        const response = await fetch(`/app/memorylane/api/memories/${memoryId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            app.loadMemories();
            if (app.currentTab === 'timeline') {
                app.loadTimeline();
            }
        } else {
            alert('Failed to delete memory: ' + result.error);
        }

    } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete memory: ' + error.message);
    }
};

window.exportTimeline = async function(format) {
    if (format !== 'website') {
        alert('This export format is coming soon!');
        return;
    }

    try {
        const response = await fetch('/app/memorylane/api/export', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ format })
        });

        const result = await response.json();

        if (result.success) {
            alert(result.message);
        } else {
            alert('Export failed: ' + result.error);
        }

    } catch (error) {
        console.error('Export error:', error);
        alert('Export failed: ' + error.message);
    }
};

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('imageModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', function() {
    app = new MemoryLane();
});

// Add styles for upload results
const additionalStyles = `
    .upload-success, .upload-error {
        background: white;
        border-radius: 10px;
        padding: 2rem;
        margin-top: 1rem;
        text-align: center;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }

    .upload-success {
        border-left: 5px solid #27ae60;
    }

    .upload-error {
        border-left: 5px solid #e74c3c;
    }

    .upload-success i {
        color: #27ae60;
        font-size: 2rem;
        margin-bottom: 1rem;
    }

    .upload-error i {
        color: #e74c3c;
        font-size: 2rem;
        margin-bottom: 1rem;
    }

    .uploaded-files {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }

    .uploaded-file {
        text-align: center;
    }

    .uploaded-file img {
        width: 80px;
        height: 80px;
        object-fit: cover;
        border-radius: 8px;
        margin-bottom: 0.5rem;
    }

    .uploaded-file p {
        font-size: 0.8rem;
        color: #666;
    }

    .no-memories, .no-timeline, .error {
        text-align: center;
        padding: 3rem;
        color: #666;
    }

    .no-memories i, .no-timeline i, .error i {
        font-size: 3rem;
        margin-bottom: 1rem;
        display: block;
    }

    .timeline-stats {
        background: rgba(102, 126, 234, 0.1);
        padding: 1rem;
        border-radius: 10px;
        margin-bottom: 2rem;
        text-align: center;
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
