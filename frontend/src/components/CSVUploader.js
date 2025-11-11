import React, { useState, useRef } from 'react';

const CSVUploader = ({ onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError('');
      setUploadResult(null);
    } else {
      setError('Please select a valid CSV file');
      setFile(null);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError('');
    setUploadResult(null);

    try {
      // Read file content
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const csvContent = e.target.result;

        try {
          const token = localStorage.getItem('token');
          const response = await fetch('http://localhost:5000/api/players/upload-csv', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ csvContent })
          });

          const data = await response.json();

          if (response.ok) {
            setUploadResult(data.data);
            setFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            if (onUploadComplete) {
              onUploadComplete(data.data);
            }
          } else {
            setError(data.message || 'Upload failed');
          }
        } catch (err) {
          setError('Failed to upload CSV file');
        } finally {
          setUploading(false);
        }
      };

      reader.onerror = () => {
        setError('Failed to read file');
        setUploading(false);
      };

      reader.readAsText(file);
    } catch (err) {
      setError('Failed to process file');
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/players/csv-template', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'player-import-template.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Failed to download template');
      }
    } catch (err) {
      setError('Failed to download template');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Import Players from CSV</h3>
        <button
          onClick={handleDownloadTemplate}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Download Template
        </button>
      </div>

      {/* Drag and Drop Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInputChange}
          className="hidden"
          id="csv-file-input"
        />
        
        <label
          htmlFor="csv-file-input"
          className="cursor-pointer"
        >
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-gray-600">
              <span className="text-blue-600 hover:text-blue-700 font-medium">
                Click to upload
              </span>
              {' '}or drag and drop
            </div>
            <p className="text-xs text-gray-500">CSV files only</p>
          </div>
        </label>

        {file && (
          <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
            <p className="text-sm text-gray-700">
              Selected: <span className="font-medium">{file.name}</span>
            </p>
          </div>
        )}
      </div>

      {/* Upload Button */}
      {file && (
        <div className="mt-4">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`w-full py-2 px-4 rounded font-medium ${
              uploading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {uploading ? 'Uploading...' : 'Upload and Process'}
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Upload Result */}
      {uploadResult && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
          <h4 className="font-semibold text-green-800 mb-2">Import Summary</h4>
          <div className="space-y-1 text-sm">
            <p className="text-green-700">
              ✓ Created: <span className="font-medium">{uploadResult.created}</span> new players
            </p>
            <p className="text-green-700">
              ✓ Updated: <span className="font-medium">{uploadResult.updated}</span> existing players
            </p>
            {uploadResult.failed > 0 && (
              <p className="text-red-700">
                ✗ Failed: <span className="font-medium">{uploadResult.failed}</span> rows
              </p>
            )}
          </div>

          {uploadResult.errors && uploadResult.errors.length > 0 && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
              <h5 className="font-semibold text-red-800 text-sm mb-2">Errors:</h5>
              <ul className="text-xs text-red-700 space-y-1 max-h-40 overflow-y-auto">
                {uploadResult.errors.map((error, idx) => (
                  <li key={idx}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h4 className="font-semibold text-blue-800 mb-2 text-sm">CSV Format Instructions</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Required columns: name, email</li>
          <li>• Optional columns: password (defaults to 'player123'), role (defaults to 'player')</li>
          <li>• Existing users will be updated based on email</li>
          <li>• Download the template above for the correct format</li>
        </ul>
      </div>
    </div>
  );
};

export default CSVUploader;
