import { Component } from '@angular/core';
import { FileInfo, FileService } from "../../service/file.service";
import { HttpEvent, HttpEventType } from "@angular/common/http";
import { DecimalPipe, NgClass } from "@angular/common";
import Swal from 'sweetalert2';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [
    DecimalPipe,
    NgClass
  ],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'] // ❌ fixed typo: was `styleUrl`
})
export class FileUploadComponent {
  selectedFiles: File[] = []; // ✅ changed from single to multiple
  previewUrls: string[] = []; // ✅ multiple preview
  files: FileInfo[] = [];
  loading = false;
  uploadProgress = 0;
  isDragOver = false;

  constructor(private fileService: FileService) {}

  ngOnInit() {
    this.loadFiles();
  }

  // ✅ handle multiple file selection
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];

    if (files.length > 0) {
      this.selectedFiles = files;
      this.previewUrls = files.map(file => URL.createObjectURL(file));
    } else {
      this.clearSelection();
    }
  }

  // ✅ handle drag & drop for multiple files
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    const files = event.dataTransfer?.files ? Array.from(event.dataTransfer.files) : [];

    if (files.length > 0) {
      this.selectedFiles = files;
      this.previewUrls = files.map(file => URL.createObjectURL(file));
    }
  }

  // ✅ clear all selected files & previews
  clearSelection() {
    this.previewUrls.forEach(url => URL.revokeObjectURL(url));
    this.selectedFiles = [];
    this.previewUrls = [];
    this.uploadProgress = 0;
    const input = document.getElementById('fileInput') as HTMLInputElement;
    if (input) input.value = '';
  }

  // ✅ multiple upload support
  upload() {
    if (!this.selectedFiles || this.selectedFiles.length === 0) return;

    const formData = new FormData();
    this.selectedFiles.forEach(file => formData.append('images', file)); // ✅ must match backend param name

    this.loading = true;
    this.uploadProgress = 0;

    this.fileService.upload(formData).subscribe({
      next: (event: HttpEvent<any>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            if (event.total) {
              this.uploadProgress = Math.round((100 * event.loaded) / event.total);
            }
            break;

          case HttpEventType.Response:
            this.loading = false;
            this.uploadProgress = 100;

            Swal.fire({
              title: '✅ Upload Complete',
              text: `${this.selectedFiles.length} file(s) uploaded successfully!`,
              icon: 'success',
              timer: 1500,
              showConfirmButton: false,
            });

            this.loadFiles();
            this.clearSelection();
            break;
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('❌ Upload failed:', err);

        Swal.fire({
          title: 'Upload Failed',
          text: 'Check backend logs or file path permissions.',
          icon: 'error',
        });
      },
    });
  }


  // ✅ fetch all files
  loadFiles() {
    this.fileService.getAll().subscribe({
      next: (res) => (this.files = res || []),
      error: (err) => console.error('Error loading files:', err),
    });
  }

  // ✅ download file
  download(name: string) {
    this.fileService.download(name).subscribe({
      next: (blob: Blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = name;
        a.click();
        window.URL.revokeObjectURL(blobUrl);
      },
      error: (err) => console.error('Download error:', err),
    });
  }

  // ✅ delete file with confirmation
  deleteFile(id: number) {
    Swal.fire({
      title: '🗑 Delete File?',
      text: 'Are you sure you want to delete this file?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#6b7280',
    }).then((result) => {
      if (result.isConfirmed) {
        this.fileService.delete(id).subscribe({
          next: (res) => {
            Swal.fire({
              title: 'Deleted!',
              text: 'File deleted successfully.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false,
            });
            this.loadFiles();
          },
          error: (err) => {
            console.error('Delete failed:', err);
            Swal.fire({
              title: 'Error',
              text: 'Could not delete file. Please try again.',
              icon: 'error',
            });
          },
        });
      }
    });
  }
}
