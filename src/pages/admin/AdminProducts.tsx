/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Search, MoreVertical, Edit2, Trash2, X, Upload, Check } from 'lucide-react';
import { useCollection } from '../../hooks/useFirebase';
import { Product, Category } from '../../types';
import { formatPrice } from '../../lib/utils';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const { data: products = [], loading: productsLoading } = useCollection<Product>('products');
  const { data: categories = [], loading: categoriesLoading } = useCollection<Category>('categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleOpenModal = (prod?: Product) => {
    if (prod) {
      setEditingProduct(prod);
      setName(prod.name);
      setDescription(prod.description);
      setPrice(prod.price.toString());
      setStock(prod.stock.toString());
      setCategory(prod.categoryId);
      setImages(prod.images);
    } else {
      setEditingProduct(null);
      setName('');
      setDescription('');
      setPrice('');
      setStock('');
      setCategory('');
      setImages([]);
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.urls) {
        setImages([...images, ...data.urls]);
        toast.success('Images uploaded');
      }
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      toast.error('At least one image is mandatory');
      return;
    }

    const productData = {
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock),
      categoryId: category,
      images,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
    };

    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        toast.success('Product updated');
      } else {
        await addDoc(collection(db, 'products'), productData);
        toast.success('Product added');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Product deleted');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await addDoc(collection(db, 'categories'), {
        name: newCategoryName.trim(),
        createdAt: new Date().toISOString()
      });
      setNewCategoryName('');
      toast.success('Category added');
    } catch (err) {
      toast.error('Failed to add category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Delete this category? This might affect product filtering.')) {
      try {
        await deleteDoc(doc(db, 'categories', id));
        toast.success('Category deleted');
      } catch (err) {
        toast.error('Failed to delete');
      }
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center text-indigo-950 font-bold">
        <div>
          <h1 className="text-3xl font-bold">Product Management</h1>
          <p className="text-neutral-500 font-normal">Manage your inventory and product listings.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={20} /> Add Product
        </button>
      </header>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 text-indigo-950">
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Search className="absolute left-4 top-3.5 text-neutral-400" size={18} />
        </div>
        <div className="flex gap-2">
            <button className="px-4 py-2 bg-neutral-100 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors">Export CSV</button>
            <button 
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors"
            >
              Manage Categories
            </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-neutral-50 border-b border-neutral-100">
            <tr>
              <th className="px-6 py-4 text-sm font-bold text-neutral-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-4 text-sm font-bold text-neutral-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-sm font-bold text-neutral-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-4 text-sm font-bold text-neutral-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-4 text-sm font-bold text-neutral-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-indigo-950 font-bold">
            {productsLoading ? (
               <tr>
                 <td colSpan={5} className="px-6 py-20 text-center text-neutral-400">Loading products...</td>
               </tr>
            ) : products.length === 0 ? (
               <tr>
                 <td colSpan={5} className="px-6 py-20 text-center text-neutral-400">No products found. Click "Add Product" to create one.</td>
               </tr>
            ) : (
              products
                .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <img src={p.images?.[0]} className="w-12 h-12 rounded-lg object-cover" alt="" />
                      <div>
                        <p className="font-bold">{p.name}</p>
                        <p className="text-xs text-neutral-500 font-normal">{p.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md text-xs font-bold uppercase">{p.categoryId || 'N/A'}</span></td>
                  <td className="px-6 py-4">{formatPrice(p.price)}</td>
                  <td className="px-6 py-4">
                     <div className={p.stock < 10 ? 'text-red-500' : ''}>
                        {p.stock} units
                     </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpenModal(p)} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Category Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Manage Categories</h2>
              <button onClick={() => setIsCategoryModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full"><X size={20} /></button>
            </div>

            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input 
                required
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                placeholder="New category name..."
                className="flex-grow p-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button type="submit" className="bg-indigo-600 text-white px-4 rounded-xl font-bold active:scale-95 transition-transform">Add</button>
            </form>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {(!categories || categories.length === 0) ? (
                <p className="text-center text-neutral-400 py-4 italic">No categories yet</p>
              ) : (
                categories?.map(cat => (
                  <div key={cat.id} className="flex justify-between items-center p-3 bg-neutral-50 rounded-xl">
                    <span className="font-medium">{cat.name}</span>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors"><Trash2 size={16} /></button>
                  </div>
                ))
              )}
            </div>
            
            <p className="text-xs text-neutral-400">Note: Categories are used for product filtering across the store.</p>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-8 max-h-[90vh] overflow-y-auto space-y-8 shadow-2xl">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">{editingProduct ? 'Edit Product' : 'New Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-neutral-700">Product Name</label>
                <input required value={name} onChange={e => setName(e.target.value)} className="w-full p-3 rounded-xl border border-neutral-200" placeholder="e.g. Premium Silk Scarf" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-neutral-700">Description</label>
                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 rounded-xl border border-neutral-200" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700">Price (GHS)</label>
                <input type="number" required value={price} onChange={e => setPrice(e.target.value)} className="w-full p-3 rounded-xl border border-neutral-200" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700">Stock Quantity</label>
                <input type="number" required value={stock} onChange={e => setStock(e.target.value)} className="w-full p-3 rounded-xl border border-neutral-200" />
              </div>
              <div className="space-y-2">
                <label htmlFor="category-select" className="text-sm font-bold text-neutral-700">Category</label>
                <select 
                  id="category-select"
                  required 
                  value={category} 
                  onChange={e => setCategory(e.target.value)} 
                  className="w-full p-3 rounded-xl border border-neutral-200 bg-white"
                >
                  <option value="">{categoriesLoading ? 'Loading categories...' : 'Select Category'}</option>
                  {categories && categories.length > 0 ? (
                    categories.map(c => (
                      <option key={c.id} value={c.name.toLowerCase()}>
                        {c.name}
                      </option>
                    ))
                  ) : null}
                </select>
                {(!categories || categories.length === 0) && (
                  <p className="text-[10px] text-amber-600 font-bold">No categories found. Click 'Manage Categories' to add some.</p>
                )}
              </div>

              {/* Image Upload */}
              <div className="md:col-span-2 space-y-4">
                <label className="block text-sm font-bold text-neutral-700">Product Images (Mandatory)</label>
                <div className="grid grid-cols-4 gap-4">
                  {images?.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-neutral-200 group">
                      <img src={img} className="w-full h-full object-cover" alt="" />
                      <button 
                        type="button"
                        onClick={() => setImages(images.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                      {idx === 0 && <span className="absolute bottom-0 inset-x-0 bg-indigo-600 text-white text-[8px] text-center font-bold uppercase py-0.5">Primary</span>}
                    </div>
                  ))}
                  <label className="aspect-square rounded-xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-600 hover:bg-indigo-50 transition-all">
                    {uploading ? <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent animate-spin rounded-full" /> : <Upload size={24} className="text-neutral-400" />}
                    <span className="text-[10px] font-bold text-neutral-400 mt-2">Upload</span>
                    <input type="file" multiple className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>

              <div className="md:col-span-2 pt-4">
                <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700">
                   <Check size={20} /> {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
