const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost',
  port: process.env.DB_PORT || process.env.POSTGRES_PORT || 5432,
  database: process.env.DB_NAME || process.env.POSTGRES_DB || 'trueid',
  user: process.env.DB_USER || process.env.POSTGRES_USER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'postgres'
};

console.log('Using database configuration:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user
});

async function fetchProfessionalRecord(recordId) {
  const pool = new Pool(dbConfig);

  try {
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to PostgreSQL database');

    // Comprehensive query joining multiple relevant tables
    const query = `
      SELECT 
        pr.*,
        -- User information
        u.name as user_name,
        u.government_id,
        u.email as user_email,
        u.verification_status as user_verification_status,
        
        -- Verification details
        va.username as verifier_name,
        
        -- Blockchain information
        bpr.tx_hash as blockchain_tx_hash,
        bpr.recorded_at as blockchain_recorded_at,
        bpr.blockchain_data,
        
        -- Document records
        json_agg(DISTINCT jsonb_build_object(
          'id', dr.id,
          'file_url', dr.file_url,
          'file_hash', dr.file_hash,
          'original_name', dr.original_name,
          'verification_status', dr.verification_status,
          'verified_by', dr.verified_by,
          'verification_date', dr.verification_date,
          'blockchain_tx_hash', dr.blockchain_tx_hash
        )) FILTER (WHERE dr.id IS NOT NULL) as documents,
        
        -- Verification requests
        json_agg(DISTINCT jsonb_build_object(
          'id', vr.id,
          'status', vr.status,
          'notes', vr.notes,
          'requested_at', vr.requested_at,
          'reviewed_at', vr.reviewed_at
        )) FILTER (WHERE vr.id IS NOT NULL) as verification_requests,
        
        -- Audit logs
        json_agg(DISTINCT jsonb_build_object(
          'action', al.action,
          'details', al.details,
          'created_at', al.created_at
        )) FILTER (WHERE al.id IS NOT NULL) as audit_logs,

        -- Additional hash information
        pr.data_hash,
        pr.ipfs_cid,
        pr.blockchain_tx_hash as record_blockchain_tx_hash,
        bpr.tx_hash as bpr_tx_hash
        
      FROM professional_records pr
      LEFT JOIN users u ON pr.user_id = u.id
      LEFT JOIN admins va ON pr.verified_by = va.id
      LEFT JOIN blockchain_professional_records bpr ON pr.id = bpr.record_id
      LEFT JOIN document_records dr ON dr.user_id = pr.user_id
      LEFT JOIN verification_requests vr ON vr.record_id = pr.id AND vr.record_type = 'professional_record'
      LEFT JOIN audit_logs al ON al.entity_id = pr.id AND al.entity_type = 'professional_record'
      WHERE pr.id = $1
      GROUP BY 
        pr.id, 
        u.id, 
        va.id,
        bpr.id;
    `;

    // Execute the query
    const result = await client.query(query, [recordId]);

    if (result.rows.length === 0) {
      console.log(`No professional record found with ID: ${recordId}`);
    } else {
      const record = result.rows[0];
      
      console.log('\n=== Professional Record Details ===');
      console.log(`ID: ${record.id}`);
      console.log(`Title: ${record.title}`);
      console.log(`Company: ${record.company_name}`);
      console.log(`Job Title: ${record.job_title}`);
      console.log(`Employment Type: ${record.employment_type}`);
      console.log(`Period: ${formatDate(record.start_date)} - ${record.is_current_job ? 'Present' : formatDate(record.end_date)}`);
      console.log(`Status: ${record.verification_status}`);
      
      console.log('\n=== Hash Information ===');
      console.log(`Data Hash: ${record.data_hash || 'Not available'}`);
      console.log(`IPFS CID: ${record.ipfs_cid || 'Not available'}`);
      console.log(`Blockchain TX Hash: ${record.blockchain_tx_hash || 'Not available'}`);
      
      if (record.blockchain_data) {
        console.log('\n=== Blockchain Data ===');
        console.log(JSON.stringify(record.blockchain_data, null, 2));
      }

      // Document hashes
      if (record.documents && record.documents.length > 0) {
        console.log('\n=== Document Hashes ===');
        record.documents.forEach(doc => {
          console.log(`\nDocument: ${doc.original_name}`);
          console.log(`File Hash: ${doc.file_hash || 'Not available'}`);
          console.log(`Blockchain TX Hash: ${doc.blockchain_tx_hash || 'Not available'}`);
        });
      }
      
      console.log('\n=== User Information ===');
      console.log(`Name: ${record.user_name}`);
      console.log(`Government ID: ${record.government_id}`);
      console.log(`Email: ${record.user_email}`);
      console.log(`Verification Status: ${record.user_verification_status}`);
      
      if (record.verified_by) {
        console.log('\n=== Verification Details ===');
        console.log(`Verified By: ${record.verifier_name}`);
        console.log(`Verified At: ${formatDate(record.verified_at)}`);
        console.log(`Verification Remarks: ${record.verification_remarks || 'None'}`);
      }
      
      if (record.blockchain_tx_hash) {
        console.log('\n=== Blockchain Information ===');
        console.log(`Transaction Hash: ${record.blockchain_tx_hash}`);
        console.log(`Recorded At: ${formatDate(record.blockchain_recorded_at)}`);
        if (record.blockchain_data) {
          console.log('Blockchain Data:', JSON.stringify(record.blockchain_data, null, 2));
        }
      }
      
      if (record.verification_requests && record.verification_requests.length > 0) {
        console.log('\n=== Verification Requests ===');
        record.verification_requests.forEach(req => {
          console.log(`\nRequest ID: ${req.id}`);
          console.log(`Status: ${req.status}`);
          console.log(`Requested: ${formatDate(req.requested_at)}`);
          if (req.reviewed_at) {
            console.log(`Reviewed: ${formatDate(req.reviewed_at)}`);
          }
          if (req.notes) {
            console.log(`Notes: ${req.notes}`);
          }
        });
      }
      
      if (record.audit_logs && record.audit_logs.length > 0) {
        console.log('\n=== Audit Trail ===');
        record.audit_logs.forEach(log => {
          console.log(`\nAction: ${log.action}`);
          console.log(`Date: ${formatDate(log.created_at)}`);
          if (log.details) {
            console.log('Details:', JSON.stringify(log.details, null, 2));
          }
        });
      }
    }

    // Close the connection
    await client.release();
    await pool.end();

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Helper function to format dates
function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString();
}

// Fetch professional record #40
fetchProfessionalRecord(40); 