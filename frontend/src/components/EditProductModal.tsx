import React, { useState } from 'react';
import { Product, productsAPI } from '../services/api';
import Modal from './Modal';
import toast from 'react-hot-toast';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onUpdate: (product: Product) => void;
}

const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  product,
  onUpdate,
}) => {
  const [targetPrice, setTargetPrice] = useState(product.targetPrice?.toString() || '');
  const [isActive, setIsActive] = useState(product.isActive);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Only allow updating tracked products that have an ID
      if (!product.id) {
        toast.error('Cannot update product that is not being tracked');
        return;
      }

      const updateData = {
        targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
        isActive,
      };

      const response = await productsAPI.update(product.id, updateData);
      onUpdate(response.data.product);
      toast.success('Product updated successfully');
      onClose();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to update product';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Product">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Title
          </label>
          <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
            {product.title}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Price
          </label>
          <p className="text-lg font-semibold text-green-600">
            ${product.currentPrice.toFixed(2)}
          </p>
        </div>

        <div>
          <label htmlFor="targetPrice" className="block text-sm font-medium text-gray-700 mb-2">
            Target Price (Optional)
          </label>
          <input
            type="number"
            id="targetPrice"
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Enter your desired price"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-500">
            You'll be notified when the price drops to or below this amount
          </p>
        </div>

        

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm bg-green-500 font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Updating...' : 'Update Product'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditProductModal;
