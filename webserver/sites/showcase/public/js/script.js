document.addEventListener('DOMContentLoaded', function() {
    // Check server status
    checkServerStatus();
    
    // Add click listener to API button
    const apiButton = document.querySelector('.button');
    if (apiButton) {
        apiButton.addEventListener('click', function(e) {
            e.preventDefault();
            callApi();
        });
    }
});

// Check if the server is responding
function checkServerStatus() {
    const statusElement = document.getElementById('status');
    
    fetch('/health')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok') {
                statusElement.textContent = 'Online';
                statusElement.classList.add('online');
            } else {
                statusElement.textContent = 'Issues Detected';
                statusElement.classList.add('offline');
            }
        })
        .catch(error => {
            statusElement.textContent = 'Offline';
            statusElement.classList.add('offline');
            console.error('Error checking server status:', error);
        });
}

// Call the showcase API
function callApi() {
    fetch('/app/showcase/api/hello')
        .then(response => response.json())
        .then(data => {
            alert(data.message);
        })
        .catch(error => {
            alert('Error calling API. Check console for details.');
            console.error('API Error:', error);
        });
}
