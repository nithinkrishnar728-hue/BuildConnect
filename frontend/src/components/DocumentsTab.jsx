import { useEffect, useState, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FaFileAlt, FaFileImage, FaFilePdf, FaDownload, FaUpload, FaEye, FaTimes } from 'react-icons/fa';
import EmptyState from './EmptyState';
import { getProjectDocuments, uploadDocument } from '../api/documents';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function DocumentsTab({ projectId }) {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewType, setPreviewType] = useState(null);
    const [previewName, setPreviewName] = useState('');

    const [selectedFile, setSelectedFile] = useState(null);
    const [description, setDescription] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchDocuments(1);
    }, [projectId]);

    const fetchDocuments = async (pageNum = 1) => {
        if (pageNum === 1) setLoading(true);
        try {
            const res = await getProjectDocuments(projectId, pageNum, 10);
            setDocuments(prev => pageNum === 1 ? res.data.documents : [...prev, ...res.data.documents]);
            setHasMore(res.data.page < res.data.pages);
            setPage(pageNum);
        } catch (error) {
            toast.error('Failed to fetch documents');
            console.error('Failed to fetch documents', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            toast.error('Please select a file to upload');
            return;
        }
        setUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('projectId', projectId);
        formData.append('description', description);
        try {
            await uploadDocument(formData);
            toast.success('Document uploaded successfully');
            setSelectedFile(null);
            setDescription('');
            if (fileInputRef.current) fileInputRef.current.value = '';
            await fetchDocuments(1);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to upload document');
            console.error('Upload failed', error);
        } finally {
            setUploading(false);
        }
    };

    // Authenticated blob download – cookie is sent so 401 never happens
    const handleDownload = async (doc) => {
        try {
            const res = await axios.get(`${API_URL}/documents/${doc._id}/download`, {
                withCredentials: true,
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = doc.fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            toast.error('Failed to download file');
            console.error(err);
        }
    };

    // Authenticated blob preview – opens image/PDF in a modal
    const handlePreview = async (doc) => {
        try {
            const res = await axios.get(`${API_URL}/documents/${doc._id}/download`, {
                withCredentials: true,
                responseType: 'blob'
            });
            const blob = new Blob([res.data], { type: doc.fileType });
            const url = window.URL.createObjectURL(blob);
            setPreviewUrl(url);
            setPreviewType(doc.fileType);
            setPreviewName(doc.fileName);
        } catch (err) {
            toast.error('Failed to preview file');
            console.error(err);
        }
    };

    const closePreview = () => {
        if (previewUrl) window.URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setPreviewType(null);
        setPreviewName('');
    };

    const getFileIcon = (mimeType) => {
        if (mimeType?.startsWith('image/')) return <FaFileImage className="text-blue-500" size={28} />;
        if (mimeType === 'application/pdf') return <FaFilePdf className="text-red-500" size={28} />;
        return <FaFileAlt className="text-gray-500" size={28} />;
    };

    const isPreviewable = (mimeType) => mimeType?.startsWith('image/') || mimeType === 'application/pdf';

    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading && page === 1) {
        return (
            <div className="flex flex-col justify-center items-center py-12 gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 text-sm">Loading documents…</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Preview Modal */}
            {previewUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={closePreview}>
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-semibold text-gray-900 truncate">{previewName}</h3>
                            <button onClick={closePreview} className="p-2 text-gray-400 hover:text-gray-700 rounded-lg">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
                            {previewType?.startsWith('image/') ? (
                                <img src={previewUrl} alt={previewName} className="max-w-full max-h-[70vh] object-contain rounded" />
                            ) : previewType === 'application/pdf' ? (
                                <iframe src={previewUrl} title={previewName} className="w-full h-[70vh] rounded" />
                            ) : null}
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Area */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FaUpload className="text-blue-600" /> Upload Document
                </h3>
                <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select File</label>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={(e) => setSelectedFile(e.target.files[0])}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition border border-gray-200 rounded-lg cursor-pointer"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                        <input
                            type="text"
                            placeholder="e.g. Blueprint v2, Invoice #1234"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                    </div>
                    <div className="flex flex-col justify-end">
                        <button
                            type="submit"
                            disabled={uploading || !selectedFile}
                            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm transition h-[42px]"
                        >
                            {uploading ? 'Uploading...' : 'Upload'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Document List */}
            {documents.length === 0 ? (
                <EmptyState
                    icon={<FaFileAlt className="w-12 h-12 text-gray-400" />}
                    title="No documents yet"
                    message="Upload permits, contracts, blueprints, or other project files to share them securely with the team."
                />
            ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {documents.map(doc => (
                            <div key={doc._id} className="p-4 hover:bg-gray-50 transition flex items-center justify-between group">
                                <div className="flex items-center space-x-4 overflow-hidden">
                                    <div className="flex-shrink-0 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        {getFileIcon(doc.fileType)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-900 truncate" title={doc.fileName}>
                                            {doc.fileName}
                                        </p>
                                        <div className="text-sm text-gray-500 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                                            <span>{formatBytes(doc.fileSize)}</span>
                                            <span>•</span>
                                            <span>{formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}</span>
                                            <span className="hidden sm:inline">•</span>
                                            <span className="truncate">By {doc.uploadedBy?.firstName} {doc.uploadedBy?.lastName}</span>
                                        </div>
                                        {doc.description && (
                                            <p className="text-sm text-gray-600 mt-1 truncate max-w-xl">{doc.description}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="ml-4 flex-shrink-0 flex items-center gap-1">
                                    {isPreviewable(doc.fileType) && (
                                        <button
                                            onClick={() => handlePreview(doc)}
                                            className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                            title="Preview"
                                        >
                                            <FaEye size={16} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDownload(doc)}
                                        className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                        title="Download"
                                    >
                                        <FaDownload size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Load More */}
            {hasMore && (
                <div className="text-center pt-2">
                    <button
                        onClick={() => fetchDocuments(page + 1)}
                        disabled={loading}
                        className="bg-white border text-blue-600 font-medium px-6 py-2.5 rounded-lg hover:bg-blue-50 transition disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Load More Documents'}
                    </button>
                </div>
            )}
        </div>
    );
}
