import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileSelected: (filePath: string) => void;
  endpoint: string;
  accept?: string;
  buttonText?: string;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export function FileUpload({
  onFileSelected,
  endpoint,
  accept = 'image/jpeg, image/png',
  buttonText = 'Upload',
  className = '',
  disabled = false,
  isLoading = false,
}: FileUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Make sure we're under the size limit (3MB)
    const THREE_MB = 3 * 1024 * 1024; // 3MB in bytes
    if (file.size > THREE_MB) {
      toast({
        title: 'File too large',
        description: 'Please select an image under 3MB.',
        variant: 'destructive',
      });
      return;
    }

    // Upload the file
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        // No need to set content-type header as it's automatically set for FormData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload file');
      }
      
      const data = await response.json();
      
      // Call the callback with the file path from the server
      onFileSelected(data.imagePath || data.profileImage || data.profileBanner);
      
      toast({
        title: 'File uploaded',
        description: 'Your file has been uploaded successfully.',
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Clear the input to allow uploading the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={className}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
        disabled={disabled || uploading || isLoading}
      />
      <Button
        type="button"
        onClick={handleButtonClick}
        disabled={disabled || uploading || isLoading}
        variant="outline"
        className="w-full"
      >
        {(uploading || isLoading) ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" /> {buttonText}
          </>
        )}
      </Button>
    </div>
  );
}