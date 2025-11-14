import React from 'react';

// Placeholder icon for 'add'
const AddIcon = () => <span className="font-bold">+</span>;

// Helper to get file extension from the room's language
const getFileExtension = (lang) => {
  switch (lang.toLowerCase()) {
    case 'python': return 'py';
    case 'javascript': return 'js';
    case 'java': return 'java';
    case 'c++': return 'cpp';
    default: return 'txt';
  }
};

const FileTabsBar = ({
  files,
  activeFileId,
  onSelectFile, // Function to call when a tab is clicked
  onAddNewFile, // Function to call from useRoom.js
  language,      // The room's language (e.g., "Java")
  onCloseFile
}) => {
  
  const handleAddNewFile = () => {
    const newFileName = prompt("Enter new file name (without extension):");
    if (newFileName) {
      const extension = getFileExtension(language);
      // Call the function from props to update the database
      onAddNewFile(`${newFileName}.${extension}`);
    }
  };

  // Convert files object to an array for easy mapping
  const fileList = files ? Object.entries(files) : [];
  const canCloseFiles = fileList.length > 1;

  return (
    <div className="flex items-center bg-gray-900 border-b border-gray-700 flex-shrink-0">
      {/* List of File Tabs */}
      {fileList.map(([fileId, file]) => {
        const isActive = fileId === activeFileId;
        return (
          <button
            key={fileId}
            onClick={() => onSelectFile(fileId)}
            className={`flex items-center gap-2 px-4 py-2 text-sm relative top-px ${
              isActive
                ? 'bg-gray-800 text-white font-semibold border-t border-x border-gray-700 rounded-t-md'
                : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            <span>{file.name}</span>
            
            {/* CLOSE BUTTON */}
            {canCloseFiles && (
              <span
                onClick={(e) => {
                  e.stopPropagation(); // Stop the click from selecting the tab
                  onCloseFile(fileId);
                }}
                // --- FIX 1: Cleaned up centering and used a symmetrical '×' ---
                className="text-gray-500 hover:text-white hover:bg-gray-600 rounded-full w-5 h-5 flex items-center justify-center text-lg leading-none pb-0.5"
                title={`Close ${file.name}`}
              >
                × 
              </span>
            )}
          </button>
        );
      })}
      
      {/* Add New Tab Button */}
      {fileList.length < 5 && (
        <button
          onClick={handleAddNewFile}
          // --- FIX 2: Added alignment classes to match the other tabs ---
          className="flex items-center justify-center px-2.5 py-2.5 text-md relative top-px text-gray-400 hover:bg-gray-800 w-5 h-5 rounded-full flex"
          title="Add new file (max 5)"
        >
          <AddIcon />
        </button>
      )}
    </div>
  );
};

export default FileTabsBar;