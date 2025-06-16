const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { Pool } = require('pg');

// Load environment variables with defaults
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'trueid_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
};

// Hide password in logs
console.log('Using database configuration:', {
  ...dbConfig,
  password: '********'
});

const pool = new Pool(dbConfig);

/**
 * Search users based on various criteria
 * @param {Object} criteria - Search criteria
 * @returns {Promise<Array>} - Array of matching users
 */
async function searchUsers(criteria) {
  const client = await pool.connect();
  try {
    console.log('Connecting to database...');
    
    // Build the WHERE clause based on provided criteria
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (criteria.username) {
      conditions.push(`u.username ILIKE $${paramCount}`);
      values.push(`%${criteria.username}%`);
      paramCount++;
    }

    if (criteria.email) {
      conditions.push(`u.email ILIKE $${paramCount}`);
      values.push(`%${criteria.email}%`);
      paramCount++;
    }

    if (criteria.governmentId) {
      conditions.push(`u.government_id ILIKE $${paramCount}`);
      values.push(`%${criteria.governmentId}%`);
      paramCount++;
    }

    if (criteria.verificationStatus) {
      conditions.push(`u.verification_status = $${paramCount}`);
      values.push(criteria.verificationStatus);
      paramCount++;
    }

    // Search for users with all related information
    const userQuery = `
      SELECT 
        u.*,
        a.username as verified_by_admin,
        (SELECT COUNT(*) FROM user_sessions us WHERE us.user_id = u.id AND us.expires_at > NOW()) as active_sessions,
        (SELECT COUNT(*) FROM audit_logs al WHERE al.user_id = u.id) as total_audit_logs,
        (SELECT COUNT(*) FROM biometric_data bd WHERE bd.user_id = u.id AND bd.is_active = true) as active_biometric_records,
        (SELECT COUNT(*) FROM document_records dr WHERE dr.user_id = u.id) as total_documents,
        (SELECT COUNT(*) FROM educational_records er WHERE er.user_id = u.id) as total_educational_records,
        (SELECT COUNT(*) FROM professional_records pr WHERE pr.user_id = u.id) as total_professional_records,
        (SELECT COUNT(*) FROM verification_requests vr WHERE vr.user_id = u.id) as total_verification_requests,
        (SELECT COUNT(*) FROM blockchain_transactions bt WHERE bt.user_id = u.id) as total_blockchain_transactions,
        EXISTS(SELECT 1 FROM profession_verification pv WHERE pv.user_id = u.id) as has_profession_verification
      FROM users u
      LEFT JOIN admins a ON u.verified_by = a.id
      ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}
      ORDER BY u.created_at DESC
      LIMIT 10
    `;

    const userResult = await client.query(userQuery, values);
    
    if (userResult.rows.length === 0) {
      console.log('\n❌ No users found matching the criteria');
      return;
    }
    
    console.log(`\n✅ Found ${userResult.rows.length} users:`);
    
    // Display each user's information
    for (const user of userResult.rows) {
      console.log('\n' + '='.repeat(80));
      console.log('\n👤 Basic Information:');
      console.log('ID:', user.id);
      console.log('Username:', user.username);
      console.log('Name:', user.name);
      console.log('Email:', user.email);
      console.log('Phone:', user.phone || 'Not provided');
      console.log('Government ID:', user.government_id);
      console.log('Contact Info:', user.contact_info || 'Not provided');
      console.log('Created At:', user.created_at);
      console.log('Updated At:', user.updated_at);

      console.log('\n🔐 Verification Status:');
      console.log('Is Verified:', user.is_verified ? 'Yes' : 'No');
      console.log('Verification Status:', user.verification_status);
      console.log('Verification Notes:', user.verification_notes || 'No notes');
      console.log('Verified At:', user.verified_at || 'Not verified');
      console.log('Verified By:', user.verified_by_admin || 'Not verified');
      console.log('Professional Verified:', user.professional_verified ? 'Yes' : 'No');

      console.log('\n💼 Blockchain Information:');
      console.log('Wallet Address:', user.wallet_address || 'Not set');
      console.log('AVAX Address:', user.avax_address || 'Not set');
      console.log('Blockchain Status:', user.blockchain_status);
      console.log('Blockchain Expiry:', user.blockchain_expiry || 'No expiry');

      console.log('\n📊 Statistics:');
      console.log('Active Sessions:', user.active_sessions);
      console.log('Total Audit Logs:', user.total_audit_logs);
      console.log('Active Biometric Records:', user.active_biometric_records);
      console.log('Total Documents:', user.total_documents);
      console.log('Total Educational Records:', user.total_educational_records);
      console.log('Total Professional Records:', user.total_professional_records);
      console.log('Total Verification Requests:', user.total_verification_requests);
      console.log('Total Blockchain Transactions:', user.total_blockchain_transactions);
      console.log('Has Profession Verification:', user.has_profession_verification ? 'Yes' : 'No');

      // Get biometric data
      const biometricQuery = `
        SELECT *
        FROM biometric_data
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;
      const biometricResult = await client.query(biometricQuery, [user.id]);

      if (biometricResult.rows.length > 0) {
        console.log('\n🔍 Biometric Data:');
        biometricResult.rows.forEach((bio, index) => {
          console.log(`\nBiometric Record #${index + 1}:`);
          console.log('ID:', bio.id);
          console.log('Hash:', bio.facemesh_hash);
          console.log('Status:', bio.is_active ? 'Active' : 'Inactive');
          console.log('Verification Status:', bio.verification_status);
          console.log('Verification Score:', bio.verification_score || 'Not available');
          console.log('Last Verified:', bio.last_verified_at || 'Never');
          console.log('Blockchain TX:', bio.blockchain_tx_hash || 'Not on blockchain');
          console.log('Created At:', bio.created_at);
          console.log('Updated At:', bio.updated_at);
        });
      }

      // Get professional records
      const professionalQuery = `
        SELECT pr.*, a.username as verified_by_admin
        FROM professional_records pr
        LEFT JOIN admins a ON pr.verified_by = a.id
        WHERE pr.user_id = $1
        ORDER BY pr.created_at DESC
      `;
      const professionalResult = await client.query(professionalQuery, [user.id]);

      if (professionalResult.rows.length > 0) {
        console.log('\n💼 Professional Records:');
        professionalResult.rows.forEach((record, index) => {
          console.log(`\nRecord #${index + 1}:`);
          console.log('ID:', record.id);
          console.log('Type:', record.record_type);
          console.log('Institution:', record.institution);
          console.log('Title:', record.title);
          console.log('Description:', record.description || 'No description');
          console.log('Company Name:', record.company_name || 'N/A');
          console.log('Job Title:', record.job_title || 'N/A');
          console.log('Employment Type:', record.employment_type || 'N/A');
          console.log('Corporate Address:', record.corporate_address || 'N/A');
          console.log('Job Responsibilities:', record.job_responsibilities || 'N/A');
          console.log('Skills Used:', record.skills_used || 'N/A');
          console.log('Start Date:', record.start_date);
          console.log('End Date:', record.end_date || 'Current');
          console.log('Is Current:', record.is_current ? 'Yes' : 'No');
          console.log('Verification Status:', record.verification_status);
          console.log('Verification Remarks:', record.verification_remarks || 'No remarks');
          console.log('Verified At:', record.verified_at || 'Not verified');
          console.log('Verified By:', record.verified_by_admin || 'Not verified');
          console.log('Document URL:', record.document_url || 'No document');
          console.log('IPFS CID:', record.ipfs_cid || 'Not on IPFS');
          console.log('Blockchain TX:', record.blockchain_tx_hash || 'Not on blockchain');
          console.log('On Blockchain:', record.on_blockchain ? 'Yes' : 'No');
          console.log('Created At:', record.created_at);
          console.log('Updated At:', record.updated_at);
        });
      }

      // Get educational records
      const educationalQuery = `
        SELECT *
        FROM educational_records
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;
      const educationalResult = await client.query(educationalQuery, [user.id]);

      if (educationalResult.rows.length > 0) {
        console.log('\n🎓 Educational Records:');
        educationalResult.rows.forEach((edu, index) => {
          console.log(`\nEducation #${index + 1}:`);
          console.log('Institution:', edu.institution_name);
          console.log('Degree/Certification:', edu.degree_certification_name);
          console.log('Grade:', edu.grade || 'Not provided');
          console.log('Start Date:', edu.start_date);
          console.log('End Date:', edu.end_date || 'Current');
          console.log('IPFS CID:', edu.ipfs_cid || 'Not on IPFS');
          console.log('Submitted By Institution:', edu.submitted_by_institution || 'No');
          console.log('Submission Date:', edu.submission_date);
          console.log('Status:', edu.status);
          console.log('Verification Remarks:', edu.verification_remarks || 'No remarks');
          console.log('Created At:', edu.created_at);
          console.log('Updated At:', edu.updated_at);
        });
      }

      // Get document records
      const documentQuery = `
        SELECT dr.*, a.username as verified_by_admin
        FROM document_records dr
        LEFT JOIN admins a ON dr.verified_by = a.id
        WHERE dr.user_id = $1
        ORDER BY dr.created_at DESC
      `;
      const documentResult = await client.query(documentQuery, [user.id]);

      if (documentResult.rows.length > 0) {
        console.log('\n📄 Document Records:');
        documentResult.rows.forEach((doc, index) => {
          console.log(`\nDocument #${index + 1}:`);
          console.log('Original Name:', doc.original_name);
          console.log('File URL:', doc.file_url || 'No URL');
          console.log('File Hash:', doc.file_hash);
          console.log('MIME Type:', doc.mime_type);
          console.log('File Size:', doc.file_size, 'bytes');
          console.log('Verification Status:', doc.verification_status);
          console.log('Verified By:', doc.verified_by_admin || 'Not verified');
          console.log('Verification Date:', doc.verification_date || 'Not verified');
          console.log('Blockchain TX:', doc.blockchain_tx_hash || 'Not on blockchain');
          console.log('Created At:', doc.created_at);
          console.log('Updated At:', doc.updated_at);
        });
      }

      // Get verification requests
      const verificationQuery = `
        SELECT vr.*, a.username as reviewed_by_admin
        FROM verification_requests vr
        LEFT JOIN admins a ON vr.reviewed_by = a.id
        WHERE vr.user_id = $1
        ORDER BY vr.created_at DESC
      `;
      const verificationResult = await client.query(verificationQuery, [user.id]);

      if (verificationResult.rows.length > 0) {
        console.log('\n✅ Verification Requests:');
        verificationResult.rows.forEach((req, index) => {
          console.log(`\nRequest #${index + 1}:`);
          console.log('Record Type:', req.record_type);
          console.log('Entity Type:', req.entity_type || 'Not specified');
          console.log('Status:', req.status);
          console.log('Notes:', req.notes || 'No notes');
          console.log('Priority:', req.priority || 'Not set');
          console.log('Verification Method:', req.verification_method || 'Not specified');
          console.log('Requested At:', req.requested_at);
          console.log('Reviewed By:', req.reviewed_by_admin || 'Not reviewed');
          console.log('Reviewed At:', req.reviewed_at || 'Not reviewed');
          console.log('Created At:', req.created_at);
          console.log('Updated At:', req.updated_at);
        });
      }

      // Get blockchain transactions
      const blockchainQuery = `
        SELECT *
        FROM blockchain_transactions
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;
      const blockchainResult = await client.query(blockchainQuery, [user.id]);

      if (blockchainResult.rows.length > 0) {
        console.log('\n⛓️ Blockchain Transactions:');
        blockchainResult.rows.forEach((tx, index) => {
          console.log(`\nTransaction #${index + 1}:`);
          console.log('Type:', tx.transaction_type);
          console.log('Hash:', tx.transaction_hash);
          console.log('Status:', tx.status);
          console.log('Network:', tx.network || 'Not specified');
          console.log('From Address:', tx.from_address || 'Not specified');
          console.log('To Address:', tx.to_address || 'Not specified');
          console.log('Block Number:', tx.block_number || 'Pending');
          console.log('Entity Type:', tx.entity_type || 'Not specified');
          console.log('Entity ID:', tx.entity_id || 'Not specified');
          console.log('Data:', tx.data ? JSON.stringify(tx.data, null, 2) : 'No data');
          console.log('Metadata:', tx.metadata ? JSON.stringify(tx.metadata, null, 2) : 'No metadata');
          console.log('Expires At:', tx.expires_at || 'No expiry');
          console.log('Created At:', tx.created_at);
          console.log('Updated At:', tx.updated_at);
        });
      }

      // Get profession verification
      const professionQuery = `
        SELECT pv.*, a.username as reviewed_by_admin
        FROM profession_verification pv
        LEFT JOIN admins a ON pv.reviewed_by = a.id
        WHERE pv.user_id = $1
        ORDER BY pv.created_at DESC
      `;
      const professionResult = await client.query(professionQuery, [user.id]);

      if (professionResult.rows.length > 0) {
        console.log('\n👔 Profession Verification:');
        professionResult.rows.forEach((prof, index) => {
          console.log(`\nVerification #${index + 1}:`);
          console.log('ID:', prof.id);
          console.log('Profession Name:', prof.profession_name);
          console.log('Image URL:', prof.image_url || 'No image');
          console.log('Status:', prof.status);
          console.log('Work Experience From:', prof.work_experience_from || 'Not specified');
          console.log('Work Experience To:', prof.work_experience_to || 'Current');
          console.log('Is Current Work:', prof.is_current_work ? 'Yes' : 'No');
          console.log('Reviewed By:', prof.reviewed_by_admin || 'Not reviewed');
          console.log('Admin Notes:', prof.admin_notes || 'No notes');
          console.log('Created At:', prof.created_at);
          console.log('Updated At:', prof.updated_at);
        });
      }

      // Get audit logs
      const auditQuery = `
        SELECT al.*, a.username as admin_username
        FROM audit_logs al
        LEFT JOIN admins a ON al.admin_id = a.id
        WHERE al.user_id = $1
        ORDER BY al.created_at DESC
        LIMIT 10
      `;
      const auditResult = await client.query(auditQuery, [user.id]);

      if (auditResult.rows.length > 0) {
        console.log('\n📝 Recent Audit Logs:');
        auditResult.rows.forEach((log, index) => {
          console.log(`\nLog #${index + 1}:`);
          console.log('Action:', log.action);
          console.log('Entity Type:', log.entity_type);
          console.log('Entity ID:', log.entity_id);
          console.log('Details:', log.details ? JSON.stringify(log.details, null, 2) : 'No details');
          console.log('IP Address:', log.ip_address);
          console.log('Admin:', log.admin_username || 'System');
          console.log('Timestamp:', log.created_at);
        });
      }

      // Get active sessions
      const sessionsQuery = `
        SELECT *
        FROM user_sessions
        WHERE user_id = $1 AND expires_at > NOW()
        ORDER BY created_at DESC
      `;
      const sessionsResult = await client.query(sessionsQuery, [user.id]);

      if (sessionsResult.rows.length > 0) {
        console.log('\n🔑 Active Sessions:');
        sessionsResult.rows.forEach((session, index) => {
          console.log(`\nSession #${index + 1}:`);
          console.log('IP Address:', session.ip_address);
          console.log('User Agent:', session.user_agent);
          console.log('Created At:', session.created_at);
          console.log('Expires At:', session.expires_at);
        });
      }

      console.log('\n' + '='.repeat(80));
    }
    
  } catch (error) {
    console.error('\n❌ Error searching for users:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const searchCriteria = {};

for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace('--', '');
  const value = args[i + 1];
  if (value) {
    searchCriteria[key] = value;
  }
}

if (Object.keys(searchCriteria).length === 0) {
  console.error('Error: Please provide search criteria');
  console.log('Usage: node search-users.js [options]');
  console.log('Options:');
  console.log('  --username <username>           Search by username');
  console.log('  --email <email>                 Search by email');
  console.log('  --governmentId <id>             Search by government ID');
  console.log('  --verificationStatus <status>   Search by verification status');
  console.log('\nExample:');
  console.log('  node search-users.js --username john --verificationStatus VERIFIED');
  process.exit(1);
}

// Run the script
console.log('=== User Search Script ===');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('\nSearching with criteria:', searchCriteria);

searchUsers(searchCriteria).catch(error => {
  process.exit(1);
}); 