import { PinataSDK } from 'pinata-web3';
import fs from 'fs';
import path from 'path';

export class PinataService {
  constructor() {
    this.pinata = new PinataSDK({
      pinataJwt: process.env.PINATA_JWT,
      pinataGateway: process.env.PINATA_GATEWAY || "https://gateway.pinata.cloud"
    });
  }

  /**
   * Upload PDF file to Pinata IPFS
   * @param {string} filePath - Path to PDF file
   * @param {object} metadata - Contract metadata
   * @returns {Promise<object>} - Upload result
   */
  async uploadContractPDF(filePath, metadata) {
    try {
      console.log('📁 Starting PDF upload to Pinata...');
      console.log('File path:', filePath);
      console.log('Metadata:', metadata);
      
      if (!fs.existsSync(filePath)) {
        throw new Error('PDF file not found: ' + filePath);
      }

      console.log('📄 File exists, reading file...');
      const fileStats = fs.statSync(filePath);
      console.log('File size:', fileStats.size, 'bytes');

      // Read file as buffer
      const fileBuffer = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);
      
      console.log('📤 Creating File object...');

      // Create File object
      const file = new File([fileBuffer], fileName, { type: 'application/pdf' });
      
      console.log('🔑 Checking Pinata JWT...');
      if (!process.env.PINATA_JWT) {
        throw new Error('PINATA_JWT environment variable is not set');
      }
      
      console.log('🚀 Uploading to Pinata...');
      // Upload file to Pinata
      const upload = await this.pinata.upload.file(file, {
        metadata: {
          name: `Contract_${metadata.contractId}`,
          keyvalues: {
            contractId: metadata.contractId,
            contractType: metadata.contractType || 'unknown',
            carId: metadata.carId || 'unknown',
            contractAddress: metadata.contractAddress || 'N/A',
            txHash: metadata.txHash || 'N/A',
            createdAt: new Date().toISOString(),
            fileType: 'contract-pdf'
          }
        },
        groupId: process.env.PINATA_GROUP_ID // Optional: organize files in groups
      });

      console.log('✅ PDF uploaded successfully to Pinata:', upload);

      return {
        success: true,
        ipfsHash: upload.IpfsHash,
        pinataUrl: `https://gateway.pinata.cloud/ipfs/${upload.IpfsHash}`,
        ipfsUrl: `ipfs://${upload.IpfsHash}`,
        size: upload.PinSize,
        timestamp: upload.Timestamp,
        fileName: fileName
      };

    } catch (error) {
      console.error('Error uploading PDF to Pinata:', error);
      throw new Error(`Pinata upload failed: ${error.message}`);
    }
  }

  /**
   * Upload contract metadata as JSON to Pinata
   * @param {object} metadata - Contract metadata
   * @returns {Promise<object>} - Upload result
   */
  async uploadContractMetadata(metadata) {
    try {
      console.log('Uploading contract metadata to Pinata:', metadata);

      const upload = await this.pinata.upload.json(metadata, {
        metadata: {
          name: `Metadata_${metadata.contractId}`,
          keyvalues: {
            contractId: metadata.contractId,
            contractType: metadata.contractType,
            carId: metadata.carId,
            contractAddress: metadata.contractAddress,
            createdAt: new Date().toISOString(),
            fileType: 'contract-metadata'
          }
        }
      });

      console.log('Metadata uploaded successfully to Pinata:', upload);

      return {
        success: true,
        ipfsHash: upload.IpfsHash,
        pinataUrl: `https://gateway.pinata.cloud/ipfs/${upload.IpfsHash}`,
        ipfsUrl: `ipfs://${upload.IpfsHash}`,
        size: upload.PinSize,
        timestamp: upload.Timestamp
      };

    } catch (error) {
      console.error('Error uploading metadata to Pinata:', error);
      throw new Error(`Metadata upload failed: ${error.message}`);
    }
  }

  /**
   * Get file info from Pinata
   * @param {string} ipfsHash - IPFS hash
   * @returns {Promise<object>} - File info
   */
  async getFileInfo(ipfsHash) {
    try {
      const fileInfo = await this.pinata.gateways.get(ipfsHash);
      return fileInfo;
    } catch (error) {
      console.error('Error getting file info from Pinata:', error);
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }

  /**
   * List all contract files
   * @param {string} contractId - Contract ID to filter
   * @returns {Promise<Array>} - List of files
   */
  async listContractFiles(contractId) {
    try {
      const files = await this.pinata.files.list()
        .keyvalue("contractId", contractId);
      
      return files.files || [];
    } catch (error) {
      console.error('Error listing contract files:', error);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Delete file from Pinata
   * @param {string} ipfsHash - IPFS hash to delete
   * @returns {Promise<boolean>} - Success status
   */
  async deleteFile(ipfsHash) {
    try {
      await this.pinata.files.delete([ipfsHash]);
      console.log('File deleted from Pinata:', ipfsHash);
      return true;
    } catch (error) {
      console.error('Error deleting file from Pinata:', error);
      return false;
    }
  }

  /**
   * Generate public URL for IPFS content
   * @param {string} ipfsHash - IPFS hash
   * @returns {string} - Public URL
   */
  getPublicUrl(ipfsHash) {
    return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
  }

  /**
   * Test Pinata connection
   * @returns {Promise<boolean>} - Connection status
   */
  async testConnection() {
    try {
      await this.pinata.testAuthentication();
      console.log('Pinata connection successful');
      return true;
    } catch (error) {
      console.error('Pinata connection failed:', error);
      return false;
    }
  }
}

export default PinataService;