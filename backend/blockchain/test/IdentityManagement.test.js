/**
 * Tests for the IdentityManagement smart contract
 */
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IdentityManagement", function () {
  let identityManagement;
  let owner;
  let government;
  let user1;
  let user2;
  
  // Constants for roles
  const USER_ROLE = ethers.utils.id("USER");
  const GOVERNMENT_ROLE = ethers.utils.id("GOVERNMENT");
  const ADMIN_ROLE = ethers.utils.id("ADMIN");
  
  // Sample data
  const biometricHash = ethers.utils.id("sample_biometric_hash");
  const professionalDataHash = ethers.utils.id("sample_professional_data_hash");
  const recordDataHash = ethers.utils.id("sample_record_data_hash");
  
  beforeEach(async function () {
    // Get signers
    [owner, government, user1, user2] = await ethers.getSigners();
    
    // Deploy the contract
    const IdentityManagement = await ethers.getContractFactory("IdentityManagement");
    identityManagement = await IdentityManagement.deploy();
    await identityManagement.deployed();
    
    // Grant government role to the government account
    await identityManagement.grantRole(government.address, GOVERNMENT_ROLE);
  });
  
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await identityManagement.hasRole(ADMIN_ROLE, owner.address)).to.equal(true);
    });
    
    it("Should grant government role correctly", async function () {
      expect(await identityManagement.hasRole(GOVERNMENT_ROLE, government.address)).to.equal(true);
    });
  });
  
  describe("Identity Management", function () {
    it("Should allow a user to create an identity", async function () {
      // Connect as user1
      const userContract = identityManagement.connect(user1);
      
      // Create identity
      await userContract.createIdentity(biometricHash, professionalDataHash);
      
      // Check if identity was created
      expect(await identityManagement.getBiometricHash(user1.address)).to.equal(biometricHash);
      expect(await identityManagement.hasRole(USER_ROLE, user1.address)).to.equal(true);
    });
    
    it("Should not allow creating duplicate identities", async function () {
      // Connect as user1
      const userContract = identityManagement.connect(user1);
      
      // Create identity
      await userContract.createIdentity(biometricHash, professionalDataHash);
      
      // Try to create another identity
      await expect(
        userContract.createIdentity(biometricHash, professionalDataHash)
      ).to.be.revertedWith("Identity already exists");
    });
    
    it("Should allow government to verify identity", async function () {
      // Connect as user1 and create identity
      const userContract = identityManagement.connect(user1);
      await userContract.createIdentity(biometricHash, professionalDataHash);
      
      // Connect as government and verify identity
      const govContract = identityManagement.connect(government);
      await govContract.verifyIdentity(user1.address);
      
      // Check if identity is verified
      expect(await identityManagement.isIdentityVerified(user1.address)).to.equal(true);
    });
    
    it("Should not allow non-government to verify identity", async function () {
      // Connect as user1 and create identity
      const userContract = identityManagement.connect(user1);
      await userContract.createIdentity(biometricHash, professionalDataHash);
      
      // Connect as user2 and try to verify identity
      const user2Contract = identityManagement.connect(user2);
      await expect(
        user2Contract.verifyIdentity(user1.address)
      ).to.be.revertedWith("Caller does not have the required role");
    });
  });
  
  describe("Professional Records", function () {
    beforeEach(async function () {
      // Connect as user1 and create identity
      const userContract = identityManagement.connect(user1);
      await userContract.createIdentity(biometricHash, professionalDataHash);
    });
    
    it("Should allow a user to add a professional record", async function () {
      // Connect as user1
      const userContract = identityManagement.connect(user1);
      
      // Add professional record
      const startDate = Math.floor(Date.now() / 1000) - 86400; // yesterday
      const endDate = 0; // current
      await userContract.addProfessionalRecord(recordDataHash, startDate, endDate);
      
      // Check if record was added
      expect(await identityManagement.getProfessionalRecordCount(user1.address)).to.equal(1);
      
      // Get the record
      const record = await identityManagement.getProfessionalRecord(user1.address, 0);
      expect(record.dataHash).to.equal(recordDataHash);
      expect(record.isVerified).to.equal(false);
    });
    
    it("Should allow government to verify a professional record", async function () {
      // Connect as user1
      const userContract = identityManagement.connect(user1);
      
      // Add professional record
      const startDate = Math.floor(Date.now() / 1000) - 86400; // yesterday
      const endDate = 0; // current
      await userContract.addProfessionalRecord(recordDataHash, startDate, endDate);
      
      // Connect as government and verify record
      const govContract = identityManagement.connect(government);
      await govContract.verifyProfessionalRecord(user1.address, 0);
      
      // Check if record is verified
      const record = await identityManagement.getProfessionalRecord(user1.address, 0);
      expect(record.isVerified).to.equal(true);
      expect(record.verifier).to.equal(government.address);
    });
  });
});
