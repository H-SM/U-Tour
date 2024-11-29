import React, { useEffect, useRef } from "react";

const CloudinaryUploadWidget = (props) => {
  const { showAlert, setPhotoURL } = props;
  const cloudName = "defrwqxv6";
  const uploadPreset = "dfr2meo6";
  const widgetRef = useRef(null);

  useEffect(() => {
    // Dynamically load Cloudinary script
    const script = document.createElement('script');
    script.src = "https://upload-widget.cloudinary.com/global/all.js";
    script.async = true;

    script.onload = () => {
      // Initialize widget once script is loaded
      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName: cloudName,
          uploadPreset: uploadPreset,
          sources: ['local', 'camera', 'url'],
          multiple: false,
          maxFiles: 1
        },
        (error, result) => {
          if (!error && result && result.event === "success") {
            const url = result.info.secure_url;
            
            try {
              // Update photo URL
              setPhotoURL(url);
              
              // Show success alert
            //   showAlert("Profile picture updated", "success");
              
            } catch (err) {
              console.error("Error updating profile picture:", err);
              showAlert("Failed to update profile picture", "error");
            }
          } else if (error) {
            console.error("Upload error:", error);
            showAlert("Upload failed", "error");
          }
        }
      );
    };

    // Append script to document
    document.body.appendChild(script);

    // Cleanup
    return () => {
      document.body.removeChild(script);
      if (widgetRef.current) {
        widgetRef.current.destroy();
      }
    };
  }, [ setPhotoURL, showAlert]);

  // Open widget function
  const openWidget = () => {
    if (widgetRef.current) {
      widgetRef.current.open();
    } else {
      console.error("Cloudinary widget not initialized");
    }
  };

  return (
    <button 
      onClick={openWidget}
      type="button"
      className="rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium w-full mx-2 mt-4 sm:m-0 sm:w-fit px-5 py-2 text-md shadow-sm"
    >
      Change
    </button>
  );
};

export default CloudinaryUploadWidget;