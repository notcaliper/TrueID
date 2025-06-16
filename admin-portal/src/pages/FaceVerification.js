import React, { useState } from 'react';
import ApiService from '../services/ApiService';
import BiometricVerificationAdmin from '../components/BiometricVerificationAdmin';
import { FaFingerprint, FaUserCheck, FaCamera } from 'react-icons/fa';

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString();
};

const truncateHash = (hash) => {
  if (!hash) return 'N/A';
  return hash.slice(0, 6) + '...' + hash.slice(-4);
};

const FaceVerification = () => {
  const [scanning, setScanning] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [professionalRecords, setProfessionalRecords] = useState([]);
  const [error, setError] = useState(null);

  const handleStartScan = () => {
    setError(null);
    setScanning(true);
    setVerificationResult(null);
  };

  const handleVerificationComplete = async (userInfo) => {
    setVerificationResult(userInfo);
    setScanning(false);
    // Fetch professional records for this user
    try {
      const res = await ApiService.listUserProfessionalRecords(userInfo.id);
      // API may return { records: [...] } or an array directly
      const records = Array.isArray(res) ? res : res.records || [];
      setProfessionalRecords(records);
    } catch (err) {
      console.error('Error fetching professional records:', err);
      setError('Could not fetch professional records');
    }
  };

  const handleVerificationError = (errorMessage) => {
    setError(errorMessage);
    setScanning(false);
  };

  const handleReset = () => {
    setScanning(false);
    setVerificationResult(null);
    setProfessionalRecords([]);
    setError(null);
  };

  return (
    <div className="face-verification-page">
      <div className="page-header">
        <h1><FaFingerprint className="header-icon" /> Biometric Verification</h1>
        <p className="description">
          Identify and verify users directly by scanning their face. The system will automatically match against registered biometric data.
        </p>
      </div>

      {!scanning && !verificationResult && (
        <div className="start-container">
          <div className="instruction-box">
            <h3><FaCamera /> Direct Face Identification</h3>
            <p>
              This system uses facial recognition to directly identify registered users.
              Simply click the button below to start the camera and scan a user's face.
            </p>
            <p>
              <strong>How it works:</strong> The system will analyze the facial features and match them against
              the biometric templates stored in the database.
            </p>
          </div>
          <button onClick={handleStartScan} className="scan-button">
            <FaCamera /> Start Face Identification
          </button>
          {error && <div className="error-message">{error}</div>}
        </div>
      )}

      {scanning && (
        <div className="verification-container">
          <BiometricVerificationAdmin
            onVerificationComplete={handleVerificationComplete}
            onError={handleVerificationError}
          />
        </div>
      )}

      {verificationResult && (
        <div className="result-container">
          <div className="result-header">
            <FaUserCheck className="success-icon" />
            <h2>Identity Verified Successfully</h2>
          </div>
          
          <div className="user-details">
            <div className="detail-row">
              <span className="detail-label">Name:</span>
              <span className="detail-value">{verificationResult.name}</span>
            </div>
            {verificationResult.username && (
              <div className="detail-row">
                <span className="detail-label">Username:</span>
                <span className="detail-value">{verificationResult.username}</span>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-label">User ID:</span>
              <span className="detail-value">{verificationResult.id}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Government ID:</span>
              <span className="detail-value">{verificationResult.government_id}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{verificationResult.email}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Created At:</span>
              <span className="detail-value">{formatDate(verificationResult.created_at)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Verification Status:</span>
              <span className="detail-value status-badge">
                {verificationResult.verification_status || 'PENDING'}
              </span>
            </div>
          </div>
          
          <div className="records-section">
            <h2>Professional Records</h2>
            {professionalRecords.length === 0 ? (
              <p>No professional records found.</p>
            ) : (
              professionalRecords.map((record, idx) => (
                <div key={record.id} className="record-card">
                  <h3>Record #{idx + 1}</h3>
                  <div className="record-details-grid">
                    <p><strong>ID:</strong> {record.id}</p>
                    <p><strong>Type:</strong> {record.type}</p>
                    <p><strong>Institution:</strong> {record.institution}</p>
                    <p><strong>Title:</strong> {record.title}</p>
                    <p><strong>Start Date:</strong> {formatDate(record.start_date)}</p>
                    <p><strong>End Date:</strong> {record.end_date ? formatDate(record.end_date) : 'N/A'}</p>
                    <p><strong>Verification Status:</strong> {record.verification_status}</p>
                    <p><strong>On Blockchain:</strong> {record.blockchain_tx_hash ? 'Yes' : 'No'}</p>
                    <p><strong>Blockchain TX:</strong> {record.blockchain_tx_hash ? truncateHash(record.blockchain_tx_hash) : 'N/A'}</p>
                    <p><strong>Created At:</strong> {formatDate(record.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="verification-details">
            <h2>Biometric Verification Details</h2>
            <div className="details-list">
              <div className="detail-item">
                <span className="detail-label">Government ID:</span>
                <span className="detail-value">{verificationResult.government_id || 'N/A'}</span>
              </div>
              {verificationResult?.facemesh_hash && (
                <div className="detail-item">
                  <span className="detail-label">Facemesh Hash:</span>
                  <span className="detail-value font-mono text-sm">
                    {truncateHash(verificationResult.facemesh_hash)}
                  </span>
                </div>
              )}
              {verificationResult?.verification_score !== undefined && (
                <div className="detail-item">
                  <span className="detail-label">Verification Score:</span>
                  <span className={`detail-value ${
                    verificationResult.verification_score > 90 ? 'text-green-500' : 
                    verificationResult.verification_score > 70 ? 'text-yellow-500' : 
                    'text-red-500'
                  }`}>
                    {`${verificationResult.verification_score}%`}
                  </span>
                </div>
              )}
              <div className="detail-item">
                <span className="detail-label">Verification Status:</span>
                <span className={`detail-value ${
                  verificationResult?.verification_status === 'VERIFIED' ? 'text-green-500' :
                  verificationResult?.verification_status === 'PENDING' ? 'text-yellow-500' :
                  'text-red-500'
                }`}>
                  {verificationResult.verification_status || 'UNKNOWN'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Last Verified:</span>
                <span className="detail-value">
                  {formatDate(verificationResult?.last_verified_at) || 'N/A'}
                </span>
              </div>
              {verificationResult?.blockchain_tx_hash && (
                <div className="detail-item">
                  <span className="detail-label">Blockchain TX:</span>
                  <span className="detail-value">
                    <a 
                      href={`https://testnet.snowtrace.io/tx/${verificationResult.blockchain_tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      {truncateHash(verificationResult.blockchain_tx_hash)}
                    </a>
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Debug log to inspect API response */}
          {console.log('Verification Result:', verificationResult)}
          
          {/* Temporary debug output - can be removed later */}
          {process.env.NODE_ENV === 'development' && console.log('Verification Data:', verificationResult)}
          
          <div className="action-buttons">
            <button onClick={handleReset} className="reset-button">
              Verify Another User
            </button>
          </div>
        </div>
      )}

      <style jsx="true">{`
        .face-verification-page {
          padding: 24px;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .page-header {
          margin-bottom: 32px;
        }
        
        .header-icon {
          margin-right: 12px;
          color: #6366f1;
        }
        
        .description {
          color: #6b7280;
          margin-top: 8px;
        }
        
        .start-container {
          background: #1f2937;
          padding: 24px;
          border-radius: 12px;
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }
        
        .instruction-box {
          background: #111827;
          border-radius: 8px;
          padding: 20px;
          width: 100%;
        }
        
        .instruction-box h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #6366f1;
          margin-top: 0;
          margin-bottom: 16px;
        }
        
        .instruction-box p {
          color: #d1d5db;
          margin-bottom: 12px;
          line-height: 1.5;
        }
        
        .instruction-box strong {
          color: #e5e7eb;
        }
        
        .scan-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 12px 24px;
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .scan-button:hover {
          background: #4f46e5;
        }
        
        .error-message {
          color: #ef4444;
          margin-top: 16px;
          padding: 12px;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 8px;
        }
        
        .verification-container {
          margin: 24px 0;
        }
        
        .result-container {
          background: #1f2937;
          border-radius: 12px;
          padding: 24px;
          margin-top: 24px;
        }
        
        .result-header {
          display: flex;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .success-icon {
          font-size: 24px;
          color: #10b981;
          margin-right: 16px;
        }
        
        .user-details {
          background: #111827;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }
        
        .detail-row {
          display: flex;
          padding: 12px 0;
          border-bottom: 1px solid #374151;
        }
        
        .detail-row:last-child {
          border-bottom: none;
        }
        
        .detail-label {
          width: 150px;
          color: #9ca3af;
          font-weight: 500;
        }
        
        .detail-value {
          flex: 1;
          color: #e5e7eb;
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          background: #374151;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 500;
        }
        
        .verification-details {
          margin-top: 24px;
        }
        
        .verification-details h2 {
          margin-top: 0;
        }
        
        .details-list {
          background: #111827;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }
        
        .detail-item {
          display: flex;
          padding: 12px 0;
          border-bottom: 1px solid #374151;
        }
        
        .detail-item:last-child {
          border-bottom: none;
        }
        
        .detail-item .detail-label {
          width: 150px;
          color: #9ca3af;
          font-weight: 500;
        }
        
        .detail-item .detail-value {
          flex: 1;
          color: #e5e7eb;
        }
        
        .action-buttons {
          display: flex;
          justify-content: flex-end;
        }
        
        .reset-button {
          padding: 10px 20px;
          background: #4b5563;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .reset-button:hover {
          background: #6b7280;
        }
        
        .debug-info {
          margin-top: 24px;
          padding: 16px;
          background: #1f2937;
          border-radius: 8px;
        }
        
        .debug-info pre {
          color: #e5e7eb;
          font-size: 14px;
          font-family: monospace;
        }

        /* Professional Records Styles */
        .records-section {
          margin-top: 32px;
        }

        .record-card {
          background: #111827;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
          border: 1px solid #374151;
        }

        .record-card h3 {
          margin-top: 0;
          margin-bottom: 12px;
          color: #93c5fd;
        }

        .record-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 8px 16px;
        }

        .record-details-grid p {
          margin: 4px 0;
          color: #e5e7eb;
          font-size: 14px;
        }

        .record-details-grid strong {
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default FaceVerification;
