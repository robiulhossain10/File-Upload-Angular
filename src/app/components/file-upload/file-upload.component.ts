import { Component } from '@angular/core';
import {FileInfo, FileService} from "../../service/file.service";
import {HttpEvent, HttpEventType} from "@angular/common/http";
import {DecimalPipe, NgClass} from "@angular/common";
import Swal from 'sweetalert2';


@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [
    DecimalPipe,
    NgClass
  ],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss'
})
export class FileUploadComponent {
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  files: FileInfo[] = [];
  loading = false;
  uploadProgress = 0;

  constructor(private fileService: FileService) {}

  /** ✅ File select handler */
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (file) {
      this.selectedFile = file;
      this.previewUrl = URL.createObjectURL(file);
    } else {
      this.clearSelection();
    }
  }


  /** ✅ Clear selected file */
  clearSelection() {
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.selectedFile = null;
    this.previewUrl = null;
    this.uploadProgress = 0;
  }

  /** ✅ Upload file */
  upload() {
    if (!this.selectedFile) return;

    const formData = new FormData();
    formData.append('image', this.selectedFile); // ✅ ঠিক করা হয়েছে

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
            alert('✅ File uploaded successfully!');
            this.loadFiles();
            this.clearSelection();
            break;
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('❌ Upload failed:', err);
        alert('❌ Upload failed! Check backend logs.');
      },
    });
  }


  /** ✅ Fetch uploaded files */
  loadFiles() {
    this.fileService.getAll().subscribe({
      next: (res) => (this.files = res || []),
      error: (err) => console.error('Error loading files:', err),
    });
  }

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


  ngOnInit() {
    this.loadFiles();
  }

  isDragOver = false;

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
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.selectedFile = file;
      this.previewUrl = URL.createObjectURL(file);
    }
  }

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
            console.log('Delete success:', res);
            Swal.fire({
              title: '✅ Deleted!',
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
              title: '❌ Error',
              text: 'Could not delete file. Please try again.',
              icon: 'error',
            });
          },
        });
      }
    });
  }




}
