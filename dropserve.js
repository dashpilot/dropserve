document.addEventListener('DOMContentLoaded', function () {
	// DOM Elements
	const welcomeScreen = document.getElementById('welcome');
	const previewScreen = document.getElementById('preview');
	const loadingScreen = document.getElementById('loading');
	const dropArea = document.getElementById('dropArea');
	const selectBtn = document.getElementById('selectBtn');
	const backBtn = document.getElementById('backBtn');
	const refreshBtn = document.getElementById('refreshBtn');
	const previewFrame = document.getElementById('previewFrame');
	const loadingMessage = document.getElementById('loadingMessage');
	const toast = document.getElementById('toast');

	// State variables
	let rootDirHandle = null;
	let indexFileHandle = null;

	// Event Listeners
	selectBtn.addEventListener('click', selectFolder);
	backBtn.addEventListener('click', resetApp);
	refreshBtn.addEventListener('click', refreshPreview);

	// Drag and drop handlers
	dropArea.addEventListener('dragover', (e) => {
		e.preventDefault();
		dropArea.classList.add('active');
	});

	dropArea.addEventListener('dragleave', (e) => {
		e.preventDefault();
		dropArea.classList.remove('active');
	});

	dropArea.addEventListener('drop', handleDrop);

	// Check if File System Access API is supported
	if (!('showDirectoryPicker' in window)) {
		showToast(
			"Your browser doesn't support the File System Access API. Please use Chrome, Edge, or another Chromium-based browser.",
			'error'
		);
	}

	// Functions
	async function selectFolder() {
		try {
			const dirHandle = await window.showDirectoryPicker();
			await processFolder(dirHandle);
		} catch (error) {
			if (error.name !== 'AbortError') {
				showToast(`Error selecting folder: ${error.message}`, 'error');
				console.error(error);
			}
		}
	}

	async function handleDrop(e) {
		e.preventDefault();
		dropArea.classList.remove('active');

		const items = e.dataTransfer.items;
		if (!items || items.length === 0) {
			showToast('No items were dropped', 'error');
			return;
		}

		const item = items[0];

		if (item.kind === 'file' && typeof item.webkitGetAsEntry === 'function') {
			const entry = item.webkitGetAsEntry();

			if (entry && entry.isDirectory) {
				try {
					// When dropping, we need to ask the user again for permission
					const dirHandle = await window.showDirectoryPicker();
					await processFolder(dirHandle);
				} catch (error) {
					showToast(`Error processing dropped folder: ${error.message}`, 'error');
					console.error(error);
				}
			} else {
				showToast('Please drop a folder, not a file', 'error');
			}
		} else {
			showToast('Unsupported drop item', 'error');
		}
	}

	async function processFolder(dirHandle) {
		showLoading('Analyzing folder...');
		rootDirHandle = dirHandle;

		try {
			// Find index.html
			let indexFile = await findIndexFile(dirHandle);

			if (indexFile) {
				indexFileHandle = indexFile;
				await processIndexFile(indexFile);

				// Switch to preview
				welcomeScreen.style.display = 'none';
				previewScreen.style.display = 'block';

				showToast(`Site "${dirHandle.name}" loaded successfully!`, 'success');
			} else {
				throw new Error(`No index.html found in "${dirHandle.name}" folder`);
			}
		} catch (error) {
			showToast(error.message, 'error');
			console.error(error);
		} finally {
			hideLoading();
		}
	}

	async function findIndexFile(dirHandle) {
		const indexFiles = ['index.html', 'index.htm', 'default.html', 'default.htm'];

		for (const fileName of indexFiles) {
			try {
				return await dirHandle.getFileHandle(fileName);
			} catch (error) {
				// File not found, continue to next
			}
		}

		return null;
	}

	async function processIndexFile(fileHandle) {
		showLoading('Processing index.html...');

		try {
			const file = await fileHandle.getFile();
			const content = await file.text();

			// Create a server script to intercept resource requests
			const serverScript = `
          <script>
            // Virtual server for handling asset requests
            (function() {
              // Map to track pending asset requests
              const pendingRequests = new Map();
              let requestId = 0;
              
              // Listen for message from parent frame
              window.addEventListener('message', function(event) {
                const message = event.data;
                
                if (message.type === 'assetResponse') {
                  const callback = pendingRequests.get(message.id);
                  if (callback) {
                    callback(message.content, message.contentType);
                    pendingRequests.delete(message.id);
                  }
                }
              });
              
              // Override fetch
              const originalFetch = window.fetch;
              window.fetch = function(url, options) {
                // Only intercept same-origin requests
                if (typeof url === 'string' && !url.startsWith('http') && !url.startsWith('//') && 
                    !url.startsWith('data:') && !url.startsWith('blob:')) {
                  return new Promise((resolve, reject) => {
                    const id = requestId++;
                    
                    // Store callback
                    pendingRequests.set(id, (content, contentType) => {
                      if (content === null) {
                        reject(new Error('Asset not found: ' + url));
                        return;
                      }
                      
                      // Convert base64 to blob
                      const binaryString = atob(content);
                      const bytes = new Uint8Array(binaryString.length);
                      for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                      }
                      
                      const blob = new Blob([bytes], { type: contentType });
                      const response = new Response(blob, {
                        status: 200,
                        statusText: 'OK',
                        headers: { 'Content-Type': contentType }
                      });
                      
                      resolve(response);
                    });
                    
                    // Request asset from parent frame
                    window.parent.postMessage({
                      type: 'assetRequest',
                      id: id,
                      path: url
                    }, '*');
                  });
                }
                
                // Pass through other requests
                return originalFetch(url, options);
              };
              
              // Override XMLHttpRequest
              const XHROpen = XMLHttpRequest.prototype.open;
              XMLHttpRequest.prototype.open = function(method, url, ...args) {
                // Only intercept same-origin requests
                if (typeof url === 'string' && !url.startsWith('http') && !url.startsWith('//') && 
                    !url.startsWith('data:') && !url.startsWith('blob:')) {
                  const xhr = this;
                  const id = requestId++;
                  
                  // Store original onload and onerror
                  const originalOnload = xhr.onload;
                  const originalOnerror = xhr.onerror;
                  
                  // Override onload and onerror
                  xhr._url = url;
                  xhr._pendingId = id;
                  
                  // Store callback
                  pendingRequests.set(id, (content, contentType) => {
                    if (content === null) {
                      const error = new Error('Asset not found: ' + url);
                      xhr.status = 404;
                      xhr.statusText = 'Not Found';
                      xhr.responseType = 'text';
                      xhr.response = xhr.responseText = error.message;
                      if (xhr.onerror) xhr.onerror();
                      return;
                    }
                    
                    // Convert base64 to blob
                    const binaryString = atob(content);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                      bytes[i] = binaryString.charCodeAt(i);
                    }
                    
                    const blob = new Blob([bytes], { type: contentType });
                    const blobUrl = URL.createObjectURL(blob);
                    
                    // Call the original XHR with the blob URL
                    XHROpen.call(xhr, method, blobUrl, ...args);
                    xhr.send();
                  });
                  
                  // Request asset from parent frame
                  window.parent.postMessage({
                    type: 'assetRequest',
                    id: id,
                    path: url
                  }, '*');
                  
                  // Prevent actual XHR for now
                  return XHROpen.call(this, 'GET', 'about:blank', ...args);
                }
                
                // Pass through other requests
                return XHROpen.call(this, method, url, ...args);
              };
            })();
          </script>
        `;

			// Insert server script at beginning of body
			let modifiedHtml;
			if (content.includes('<body>')) {
				modifiedHtml = content.replace('<body>', '<body>' + serverScript);
			} else if (content.includes('<body ')) {
				modifiedHtml = content.replace(/<body ([^>]*)>/, '<body $1>' + serverScript);
			} else {
				modifiedHtml = content + serverScript;
			}

			// Create blob URL
			const blob = new Blob([modifiedHtml], { type: 'text/html' });
			const url = URL.createObjectURL(blob);

			// Load in iframe
			previewFrame.src = url;
		} catch (error) {
			throw new Error(`Error processing index file: ${error.message}`);
		}
	}

	async function getAssetContent(path) {
		// Remove query string and hash
		const cleanPath = path.split('?')[0].split('#')[0];

		// Handle absolute paths
		const normalizedPath = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;

		if (!normalizedPath) {
			return { content: null, contentType: null };
		}

		try {
			const pathParts = normalizedPath.split('/');
			const fileName = pathParts.pop();
			let currentDir = rootDirHandle;

			// Navigate through directories
			for (const part of pathParts) {
				if (!part || part === '.') continue;
				if (part === '..') throw new Error('Cannot navigate above root directory');

				try {
					currentDir = await currentDir.getDirectoryHandle(part);
				} catch (error) {
					return { content: null, contentType: null };
				}
			}

			// Get file
			let fileHandle;
			try {
				fileHandle = await currentDir.getFileHandle(fileName);
			} catch (error) {
				return { content: null, contentType: null };
			}

			// Read file and convert to base64
			const file = await fileHandle.getFile();
			const contentType = getContentType(fileName);
			const arrayBuffer = await file.arrayBuffer();
			const bytes = new Uint8Array(arrayBuffer);
			let binary = '';
			for (let i = 0; i < bytes.byteLength; i++) {
				binary += String.fromCharCode(bytes[i]);
			}
			const base64 = btoa(binary);

			return { content: base64, contentType };
		} catch (error) {
			console.error(`Error loading asset: ${path}`, error);
			return { content: null, contentType: null };
		}
	}

	function getContentType(fileName) {
		const extension = fileName.split('.').pop().toLowerCase();

		const contentTypes = {
			html: 'text/html',
			htm: 'text/html',
			css: 'text/css',
			js: 'application/javascript',
			mjs: 'application/javascript',
			json: 'application/json',
			svg: 'image/svg+xml',
			png: 'image/png',
			jpg: 'image/jpeg',
			jpeg: 'image/jpeg',
			gif: 'image/gif',
			webp: 'image/webp',
			ico: 'image/x-icon',
			woff: 'font/woff',
			woff2: 'font/woff2',
			ttf: 'font/ttf',
			otf: 'font/otf',
			eot: 'application/vnd.ms-fontobject'
		};

		return contentTypes[extension] || 'application/octet-stream';
	}

	function refreshPreview() {
		if (indexFileHandle) {
			processIndexFile(indexFileHandle);
			showToast('Preview refreshed', 'info');
		}
	}

	function resetApp() {
		// Clear iframe
		previewFrame.src = 'about:blank';

		// Switch back to welcome screen
		previewScreen.style.display = 'none';
		welcomeScreen.style.display = 'flex';
	}

	function showLoading(message) {
		loadingMessage.textContent = message || 'Loading...';
		loadingScreen.style.display = 'flex';
	}

	function hideLoading() {
		loadingScreen.style.display = 'none';
	}

	function showToast(message, type) {
		toast.textContent = message;
		toast.className = `toast ${type || 'info'}`;
		toast.classList.add('visible');

		setTimeout(() => {
			toast.classList.remove('visible');
		}, 4000);
	}

	// Listen for asset requests from iframe
	window.addEventListener('message', async function (event) {
		const message = event.data;

		if (message && message.type === 'assetRequest') {
			const { id, path } = message;
			const { content, contentType } = await getAssetContent(path);

			// Send response back to iframe
			previewFrame.contentWindow.postMessage(
				{
					type: 'assetResponse',
					id: id,
					content: content,
					contentType: contentType
				},
				'*'
			);
		}
	});
});
