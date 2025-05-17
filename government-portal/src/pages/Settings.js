import React from 'react';
import { motion } from 'framer-motion';
import { FaCog, FaServer, FaDatabase, FaNetworkWired } from 'react-icons/fa';

const Settings = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">System Settings</h1>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
      >
        <div className="text-center py-8">
          <FaCog className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Settings Page</h2>
          <p className="text-gray-600">
            This is a placeholder for the settings page. Full settings functionality will be implemented in a future update.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings; 