import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FileInfo {
  id: number;
  name: string;
  url?: string;
  image?: string; // base64 encoded
}

@Injectable({ providedIn: 'root' })
export class FileService {
  private apiUrl = 'http://localhost:9091/api/storage';

  constructor(private http: HttpClient) {}


  upload(data: FormData): Observable<HttpEvent<any>> {
    return this.http.post<any>(`${this.apiUrl}/fileupload`, data, {
      reportProgress: true,
      observe: 'events',
    });
  }



  getAll(): Observable<FileInfo[]> {
    return this.http.get<FileInfo[]>(`${this.apiUrl}`);
  }

  /** ✅ Download file */
  download(name: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${name}`, {
      responseType: 'blob'
    }) as Observable<Blob>;
  }

  /** 🗑 Delete file by ID */
  delete(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }



}
