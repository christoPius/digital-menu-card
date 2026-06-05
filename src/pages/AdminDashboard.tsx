import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Folders,
  Settings,
  QrCode,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Upload,
  Download,
  Search,
  Building,
  Info,
  ChevronRight,
  Eye,
  AlertCircle
} from 'lucide-react';
import { dbService } from '../services/db';
import { Category, MenuItem, RestaurantInfo, User } from '../types/menu';

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'categories' | 'settings' | 'qr'>('overview');
  
  // Loading & feedback indicators
  const [loading, setLoading] = useState<boolean>(true);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  // States for CRUD modals
  const [itemModalOpen, setItemModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    imageURL: '',
    availability: true,
    dietaryTags: [] as string[]
  });

  const [categoryModalOpen, setCategoryModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    categoryName: '',
    description: ''
  });

  // Settings states
  const [settingsForm, setSettingsForm] = useState<RestaurantInfo>({
    name: '',
    logoURL: '',
    address: '',
    contactNumber: '',
    coverURL: ''
  });

  // Local uploads preview buffer
  const [imagePreview, setImagePreview] = useState<string>('');

  // Search filter for lists
  const [menuSearch, setMenuSearch] = useState<string>('');

  const navigate = useNavigate();
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const currentUser = await dbService.getCurrentUser();
        if (!currentUser) {
          navigate('/admin/login');
          return;
        }
        setUser(currentUser);

        const [info, cats, items] = await Promise.all([
          dbService.getRestaurantInfo(),
          dbService.getCategories(),
          dbService.getMenuItems()
        ]);

        setRestaurant(info);
        setCategories(cats);
        setMenuItems(items);
        setSettingsForm(info);
      } catch (err) {
        console.error('Failed loading admin database', err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, [navigate]);

  const triggerAlert = (text: string, type: 'success' | 'danger' = 'success') => {
    setAlertMsg({ text, type });
    setTimeout(() => {
      setAlertMsg(null);
    }, 4000);
  };

  const handleLogout = async () => {
    await dbService.logout();
    navigate('/admin/login');
  };

  // Real Firebase Storage upload handles
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'item' | 'logo' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaveLoading(true);
    triggerAlert('Uploading image file safely to Cloud Storage...', 'success');
    
    try {
      const folderMap = {
        item: 'recipes',
        logo: 'branding',
        cover: 'covers'
      };
      
      const downloadUrl = await dbService.uploadImage(file, folderMap[target]);
      
      if (target === 'item') {
        setItemForm(prev => ({ ...prev, imageURL: downloadUrl }));
        setImagePreview(downloadUrl);
      } else if (target === 'logo') {
        setSettingsForm(prev => ({ ...prev, logoURL: downloadUrl }));
      } else if (target === 'cover') {
        setSettingsForm(prev => ({ ...prev, coverURL: downloadUrl }));
      }
      triggerAlert('Culinary image published to Cloud Storage successfully');
    } catch (err: any) {
      triggerAlert('Image cloud storage failure: ' + (err?.message || err), 'danger');
    } finally {
      setSaveLoading(false);
    }
  };

  // Create or Update Menu Item
  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);

    try {
      if (!itemForm.categoryId) {
        triggerAlert('Please assign a menu category relationship', 'danger');
        setSaveLoading(false);
        return;
      }

      const parsedPrice = parseFloat(itemForm.price) || 0;

      if (editingItem) {
        const updated = await dbService.updateMenuItem({
          ...editingItem,
          name: itemForm.name,
          description: itemForm.description,
          price: parsedPrice,
          categoryId: itemForm.categoryId,
          imageURL: itemForm.imageURL,
          availability: itemForm.availability,
          dietaryTags: itemForm.dietaryTags
        });
        setMenuItems(prev => prev.map(i => i.id === updated.id ? updated : i));
        triggerAlert('Gourmet recipe updated successfully');
      } else {
        const created = await dbService.createMenuItem({
          name: itemForm.name,
          description: itemForm.description,
          price: parsedPrice,
          categoryId: itemForm.categoryId,
          imageURL: itemForm.imageURL,
          availability: itemForm.availability,
          dietaryTags: itemForm.dietaryTags
        });
        setMenuItems(prev => [created, ...prev]);
        triggerAlert('New gourmet recipe registered successfully');
      }
      setItemModalOpen(false);
      resetItemForm();
    } catch (err) {
      triggerAlert('Failed to update recipe: ' + err, 'danger');
    } finally {
      setSaveLoading(false);
    }
  };

  const startEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      categoryId: item.categoryId,
      imageURL: item.imageURL,
      availability: item.availability,
      dietaryTags: item.dietaryTags || []
    } as any);
    setImagePreview(item.imageURL);
    setItemModalOpen(true);
  };

  const deleteItemItem = async (id: string) => {
    if (!window.confirm('Are you absolutely sure you want to remove this culinary dish?')) return;
    try {
      await dbService.deleteMenuItem(id);
      setMenuItems(prev => prev.filter(i => i.id !== id));
      triggerAlert('Culinary masterpiece deleted from card');
    } catch (err) {
      triggerAlert('Operational failure: ' + err, 'danger');
    }
  };

  const toggleAvailabilityState = async (id: string) => {
    try {
      const updatedStatus = await dbService.toggleAvailability(id);
      setMenuItems(prev => prev.map(i => i.id === id ? { ...i, availability: updatedStatus } : i));
      triggerAlert(updatedStatus ? 'Dishes back in kitchen service' : 'Dish marked out of stock');
    } catch (err) {
      triggerAlert('Failed to toggle item availability: ' + err, 'danger');
    }
  };

  const resetItemForm = () => {
    setEditingItem(null);
    setItemForm({
      name: '',
      description: '',
      price: '',
      categoryId: categories[0]?.id || '',
      imageURL: '',
      availability: true,
      dietaryTags: []
    });
    setImagePreview('');
  };

  // Category Operations CRUD
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);

    try {
      if (editingCategory) {
        const updated = await dbService.updateCategory({
          ...editingCategory,
          categoryName: categoryForm.categoryName,
          description: categoryForm.description
        });
        setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
        triggerAlert('Branded collection updated');
      } else {
        const created = await dbService.createCategory({
          categoryName: categoryForm.categoryName,
          description: categoryForm.description
        });
        setCategories(prev => [...prev, created]);
        triggerAlert('New menu category designed');
      }
      setCategoryModalOpen(false);
      resetCategoryForm();
    } catch (err) {
      triggerAlert('Category update error: ' + err, 'danger');
    } finally {
      setSaveLoading(false);
    }
  };

  const startEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryForm({
      categoryName: cat.categoryName,
      description: cat.description
    });
    setCategoryModalOpen(true);
  };

  const deleteCategoryItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category? Associated dishes will become unassigned.')) return;
    try {
      await dbService.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      // Reload items to update unassigned categories
      const refreshedItems = await dbService.getMenuItems();
      setMenuItems(refreshedItems);
      triggerAlert('Menu category removed successfully');
    } catch (err) {
      triggerAlert('Deletion aborted: ' + err, 'danger');
    }
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryForm({
      categoryName: '',
      description: ''
    });
  };

  // Save Restaurant Settings
  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);

    try {
      const updated = await dbService.updateRestaurantInfo(settingsForm);
      setRestaurant(updated);
      triggerAlert('L’Aura core branding configuration updated');
    } catch (err) {
      triggerAlert('Failed updating restaurant profile settings: ' + err, 'danger');
    } finally {
      setSaveLoading(false);
    }
  };

  // Fast Download QR canvas to PNG helper
  const downloadQRCodePng = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) return;

    const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = pngUrl;
    downloadAnchor.download = `${restaurant?.name || 'LAura-Menu'}-Digital-QR.png`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    triggerAlert('Premium high-res QR flyer downloaded');
  };

  // Base production-ready menu URL
  const publicMenuUrl = `${window.location.origin}/menu`;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800">
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full mb-4"
        />
        <h3 className="font-sans font-bold text-lg tracking-tight text-slate-900 animate-pulse uppercase">
          Reclining Salon Panels
        </h3>
        <p className="font-sans text-xs text-slate-500 mt-1">Bootstrapping restaurant settings cache</p>
      </div>
    );
  }

  // Derived dashboard analytics values
  const totalItems = menuItems.length;
  const totalCategories = categories.length;
  const inStockCount = menuItems.filter(i => i.availability).length;
  const inStockPercentage = totalItems > 0 ? Math.round((inStockCount / totalItems) * 100) : 100;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between shrink-0 text-slate-100">
        <div>
          {/* Brand profile banner */}
          <div className="p-6 border-b border-slate-800 bg-slate-950 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-emerald-500 to-emerald-300 flex items-center justify-center text-slate-950 font-serif font-black text-xl shadow-lg ring-2 ring-emerald-500/10">
              {restaurant?.name?.charAt(0) || 'L'}
            </div>
            <div>
              <h1 className="font-sans font-bold text-sm text-slate-100 leading-tight truncate max-w-[140px]">
                {restaurant?.name || "L’Aura Culinaire"}
              </h1>
              <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-semibold mt-0.5">
                Executive Desk
              </p>
            </div>
          </div>

          {/* Quick Menu Lists */}
          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl text-xs font-medium tracking-wide transition-all ${
                activeTab === 'overview'
                  ? 'bg-emerald-600 text-white font-semibold shadow shadow-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              id="sidebar-nav-overview"
            >
              <LayoutDashboard className="w-4 h-4" /> Overview Dashboard
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl text-xs font-medium tracking-wide transition-all ${
                activeTab === 'menu'
                  ? 'bg-emerald-600 text-white font-semibold shadow shadow-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              id="sidebar-nav-menu"
            >
              <UtensilsCrossed className="w-4 h-4" /> Recipe Management
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl text-xs font-medium tracking-wide transition-all ${
                activeTab === 'categories'
                  ? 'bg-emerald-600 text-white font-semibold shadow shadow-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              id="sidebar-nav-categories"
            >
              <Folders className="w-4 h-4" /> Collection Categories
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl text-xs font-medium tracking-wide transition-all ${
                activeTab === 'qr'
                  ? 'bg-emerald-600 text-white font-semibold shadow shadow-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              id="sidebar-nav-qr"
            >
              <QrCode className="w-4 h-4" /> Flyer QR System
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl text-xs font-medium tracking-wide transition-all ${
                activeTab === 'settings'
                  ? 'bg-emerald-600 text-white font-semibold shadow shadow-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              id="sidebar-nav-settings"
            >
              <Settings className="w-4 h-4" /> System Core Profile
            </button>
          </nav>
        </div>

        {/* User identification desk */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="truncate max-w-[140px]">
              <span className="block text-xs font-semibold text-slate-300 leading-tight truncate">
                {user?.name}
              </span>
              <span className="block text-[9px] text-slate-500 font-mono tracking-tight leading-tight truncate">
                {user?.email}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-400 rounded-lg bg-slate-900 hover:bg-red-950/20 transition-all border border-slate-800"
              title="Terminate Admin Session"
              id="admin-logout-btn"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel Content Box */}
      <main className="flex-1 flex flex-col overflow-y-auto max-h-screen relative bg-slate-50 text-slate-800">
        
        {/* Floating Custom Toast Alarm messages */}
        <AnimatePresence>
          {alertMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 py-3.5 px-5 rounded-xl border shadow-xl text-xs flex gap-2.5 items-center w-[90%] max-w-sm font-medium ${
                alertMsg.type === 'success'
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-rose-600 border-rose-500 text-white'
              }`}
            >
              <Check className="w-4.5 h-4.5 text-white shrink-0" />
              <span>{alertMsg.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upper Action Bar */}
        <header className="py-5 px-6 md:px-8 border-b border-slate-200/80 bg-white flex items-center justify-between">
          <div>
            <h2 className="font-sans text-lg md:text-xl font-bold tracking-tight text-slate-900">
              {activeTab === 'overview' && 'Executive Salon Overview'}
              {activeTab === 'menu' && 'Recipe & Delicacy Ledger'}
              {activeTab === 'categories' && 'Gourmet Collection Design'}
              {activeTab === 'qr' && 'Aesthetic QR Flyer Hub'}
              {activeTab === 'settings' && 'Restaurant Core Profile Settings'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {activeTab === 'overview' && 'A digital summary of your culinary operations'}
              {activeTab === 'menu' && 'Publish, suspend, price, or edit premium food card variables'}
              {activeTab === 'categories' && 'Formulate sections to support clean customer navigation'}
              {activeTab === 'qr' && 'Print, test, or distribute flyers linking customers right here'}
              {activeTab === 'settings' && 'Update address information, logo, headers or names'}
            </p>
          </div>

          <a
            href="/menu"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-display text-[11px] uppercase tracking-widest font-semibold px-4 py-2 bg-white hover:bg-slate-50 text-emerald-600 border border-slate-200 rounded-xl transition-all"
            id="preview-menu-btn"
          >
            <Eye className="w-3.5 h-3.5" /> Customer Card <svg className="w-3 h-3 block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
        </header>

        {/* Center Panel viewport */}
        <section className="p-6 md:p-8 space-y-6">

          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Analytics bento grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between"
                >
                  <div>
                    <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                      TOTAL RECIPES ON DOCKED CARD
                    </span>
                    <span className="block text-3xl font-sans font-extrabold text-slate-900 mt-2">
                      {totalItems}
                    </span>
                    <span className="block text-[10px] text-slate-500 mt-1">
                      Menu dishes currently online
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl">
                    <UtensilsCrossed className="w-6 h-6" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }}
                  className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between"
                >
                  <div>
                    <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                      MENU COLLECTIONS
                    </span>
                    <span className="block text-3xl font-sans font-extrabold text-slate-900 mt-2">
                      {totalCategories}
                    </span>
                    <span className="block text-[10px] text-slate-500 mt-1">
                      Unique visual groupings
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl">
                    <Folders className="w-6 h-6" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
                  className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between"
                >
                  <div>
                    <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                      SERVICE AVAILABILITY
                    </span>
                    <span className="block text-3xl font-sans font-extrabold text-emerald-600 mt-2">
                      {inStockPercentage}%
                    </span>
                    <span className="block text-[10px] text-slate-500 mt-1">
                      {inStockCount} of {totalItems} items in service
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl">
                    <Check className="w-6 h-6" />
                  </div>
                </motion.div>
              </div>

              {/* Quick Start Desk guide */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-800 relative overflow-hidden text-white">
                <div className="absolute right-0 bottom-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                <h3 className="font-sans font-bold text-lg text-white tracking-wide">
                  Welcome to Your Digital Menu Card Service!
                </h3>
                <p className="text-slate-350 text-slate-300 text-xs mt-2 max-w-2xl leading-relaxed">
                  The menu management panel supports immediate interactive changes. As an administrator, any recipe item you build, categorize or toggle available from this portal will update immediately on the customer menu page.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <div onClick={() => setActiveTab('menu')} className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 cursor-pointer border border-slate-700/40 transition-all flex items-start gap-3 text-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-100">Adjust Recipe Cards</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        Adjust photos, descriptions, and tag specific categories to guide order volume easily.
                      </p>
                    </div>
                  </div>

                  <div onClick={() => setActiveTab('qr')} className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 cursor-pointer border border-slate-700/40 transition-all flex items-start gap-3 text-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-100">Print High-Res QR Flyers</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        Customize visual color rules, download flyer PNG images to stick on guest tables.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MENU/RECIPE MANAGEMENT */}
          {activeTab === 'menu' && (
            <div className="space-y-4">
              
              {/* Operations header controls */}
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
                <div className="relative flex items-center bg-slate-50 rounded-xl border border-slate-200 pl-3.5 flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search menu recipes..."
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    className="w-full py-2.5 px-3 text-xs text-slate-750 focus:outline-none placeholder-slate-400 font-sans pl-1"
                  />
                </div>

                <button
                  onClick={() => {
                    resetItemForm();
                    setItemModalOpen(true);
                  }}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-750 text-white font-semibold text-xs tracking-wide uppercase rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 hover:cursor-pointer"
                  id="add-recipe-btn"
                >
                  <Plus className="w-4 h-4" /> Add Gourmet Dish
                </button>
              </div>

              {/* Recipe card grid list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuItems
                  .filter(i =>
                    i.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
                    i.description.toLowerCase().includes(menuSearch.toLowerCase())
                  )
                  .map((item) => {
                    const matchedCat = categories.find(c => c.id === item.categoryId);
                    return (
                      <div
                        key={item.id}
                        className={`bg-white rounded-2xl border transition-all p-4 flex gap-4 shadow-sm ${
                          item.availability
                            ? 'border-slate-200/70'
                            : 'border-slate-200/40 bg-slate-50 opacity-75'
                        }`}
                      >
                        {/* Avatar */}
                        <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-50 relative border border-slate-200/60">
                          {item.imageURL ? (
                            <img
                              src={item.imageURL}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-sans text-emerald-600 text-xl font-bold bg-emerald-50">
                              {item.name.charAt(0)}
                            </div>
                          )}
                          {!item.availability && (
                            <span className="absolute inset-0 bg-slate-900/60 text-[8px] tracking-widest text-center text-white font-bold uppercase flex items-center justify-center">
                              Inactive
                            </span>
                          )}
                        </div>

                        {/* Description contents */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-bold text-slate-950 truncate">
                                {item.name}
                              </h4>
                              <span className="text-sm font-semibold text-emerald-600 font-display">
                                ₹{item.price.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              <span className="text-[9px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-sm inline-block border border-emerald-100/60">
                                {matchedCat?.categoryName || 'Unassigned Category'}
                              </span>
                              {item.dietaryTags && item.dietaryTags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          </div>

                          {/* Quick Admin action bars */}
                          <div className="flex items-center justify-between border-t border-slate-100 mt-3 pt-3">
                            <button
                              onClick={() => toggleAvailabilityState(item.id)}
                              className={`text-[10px] uppercase tracking-wider font-semibold py-1 px-3 rounded-md border flex items-center gap-1.5 transition-all ${
                                item.availability
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}
                              id={`toggle-availability-${item.id}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${item.availability ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                              {item.availability ? 'In Kitchen Service' : 'Mark Out'}
                            </button>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => startEditItem(item)}
                                className="p-2 text-slate-500 hover:text-emerald-600 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200"
                                id={`edit-item-btn-${item.id}`}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteItemItem(item.id)}
                                className="p-2 text-slate-400 hover:text-rose-600 rounded-lg bg-slate-50 hover:bg-rose-50 transition-colors border border-slate-200"
                                id={`delete-item-btn-${item.id}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB 3: CATEGORY MANAGEMENT */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
                <p className="text-xs text-slate-500 font-medium">Formulate structural categories to route your customers accurately</p>
                <button
                  onClick={() => {
                    resetCategoryForm();
                    setCategoryModalOpen(true);
                  }}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs tracking-wide uppercase rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 hover:cursor-pointer"
                  id="add-category-btn"
                >
                  <Plus className="w-4 h-4" /> Add Section Collection
                </button>
              </div>

              {/* Categorization list */}
              <div className="space-y-3">
                {categories.map((cat) => {
                  const itemsInCat = menuItems.filter(i => i.categoryId === cat.id).length;
                  return (
                    <div
                      key={cat.id}
                      className="bg-white border border-slate-200/60 shadow-sm rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="font-sans font-bold text-base text-slate-900">
                            {cat.categoryName}
                          </h4>
                          <span className="text-[9px] uppercase tracking-widest font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">
                            {itemsInCat} Recipe Dishes
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 max-w-xl">
                          {cat.description || "No visual category tagline declared."}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          onClick={() => startEditCategory(cat)}
                          className="p-2 text-slate-650 text-slate-600 hover:text-emerald-600 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200 flex items-center justify-center gap-1.5 px-3 text-xs"
                          id={`edit-cat-${cat.id}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Adjust Description
                        </button>
                        <button
                          onClick={() => deleteCategoryItem(cat.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-lg bg-slate-50 hover:bg-rose-50 transition-colors border border-slate-200"
                          id={`delete-cat-${cat.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: FLYER QR GENERATOR SYSTEM */}
          {activeTab === 'qr' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* QR Designer Options */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                <h4 className="font-sans font-bold text-base text-slate-900">Interactive QR Settings</h4>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Guests scan this flyer to parse recipes immediately on their smartphone screens. Below is your configured public digital menu card link:
                </p>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 select-all scrollbar-thin overflow-x-auto">
                  <span className="text-[11px] font-mono text-emerald-700 whitespace-nowrap">
                    {publicMenuUrl}
                  </span>
                </div>

                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 text-slate-700 flex gap-2.5 items-start">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    This QR flyer renders fully dynamic updates. Even after downloading and pasting this QR code in print files or table signage, any menu changes or prices you adjust via this SaaS console remain instantly updated live.
                  </p>
                </div>

                <button
                  onClick={downloadQRCodePng}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs tracking-wider uppercase rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  id="download-qr-action"
                >
                  <Download className="w-4.5 h-4.5" /> Download QR Code PNG
                </button>
              </div>

              {/* QR Artboard preview framed */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl flex flex-col items-center justify-center text-slate-900 text-center relative max-w-sm mx-auto">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-t-3xl" />
                
                <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-emerald-800 mb-1 font-display">
                  {restaurant?.name || "L’Aura Culinaire"}
                </span>
                <h5 className="font-sans font-extrabold text-xl text-slate-950 tracking-tight">
                  SCAN TO EXPERIENCE
                </h5>
                <p className="text-[10px] text-slate-500 max-w-xs mt-1 mb-6 leading-relaxed">
                  Fresh gourmet recipes, chefs curated pricing & seasonal arrivals
                </p>

                {/* Main QR Frame */}
                <div ref={qrRef} className="p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl shadow-inner mb-6 flex items-center justify-center">
                  <QRCodeCanvas
                     value={publicMenuUrl}
                     size={200}
                     bgColor="#ffffff"
                     fgColor="#0f172a"
                     level="H"
                     includeMargin={true}
                  />
                </div>

                <div className="flex items-center gap-2 text-slate-400 text-[9px] uppercase font-bold tracking-widest bg-slate-50 px-3 py-1.5 rounded-full border border-slate-150">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live Smart Menu Flyer
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: RESTAURANT PROFILE SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm text-slate-800">
              <form onSubmit={saveSettings} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-600 text-[10px] uppercase font-bold tracking-widest block mb-1.5 pl-0.5">
                      Restaurant Name Style
                    </label>
                    <input
                      type="text"
                      value={settingsForm.name}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="w-full py-3 px-4 bg-slate-50 border border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs focus:outline-none transition-all focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 text-[10px] uppercase font-bold tracking-widest block mb-1.5 pl-0.5">
                      Hotline / Contact Number
                    </label>
                    <input
                      type="text"
                      value={settingsForm.contactNumber}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, contactNumber: e.target.value }))}
                      className="w-full py-3 px-4 bg-slate-50 border border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs focus:outline-none transition-all focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-600 text-[10px] uppercase font-bold tracking-widest block mb-1.5 pl-0.5">
                    Culinary Bistro Address
                  </label>
                  <input
                    type="text"
                    value={settingsForm.address}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full py-3 px-4 bg-slate-50 border border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs focus:outline-none transition-all focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-600 text-[10px] uppercase font-bold tracking-widest block mb-1.5 pl-0.5">
                    Restaurant Branding Header Logo
                  </label>
                  
                  <div className="mt-2 flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center font-sans text-2xl font-bold text-emerald-600 shrink-0 border border-slate-200 overflow-hidden shadow-sm">
                      {settingsForm.logoURL ? (
                        <img src={settingsForm.logoURL} alt="Branding preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        settingsForm.name.charAt(0) || 'L'
                      )}
                    </div>
                    
                    <div className="flex-1 text-left">
                      <p className="text-slate-500 text-xs">Upload custom vector/bistro logo. Renders instantly in head banner.</p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <label className="py-2 px-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1">
                          <Upload className="w-3.5 h-3.5 text-slate-500" /> Upload Logo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'logo')}
                            className="hidden"
                          />
                        </label>
                        {settingsForm.logoURL && (
                          <button
                            type="button"
                            onClick={() => setSettingsForm(prev => ({ ...prev, logoURL: '' }))}
                            className="py-2 px-3 text-rose-500 hover:bg-rose-50 rounded-lg text-xs font-semibold"
                          >
                            Clear Logo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-slate-600 text-[10px] uppercase font-bold tracking-widest block mb-1.5 pl-0.5">
                    Ambient Restaurant Cover Banner Photo
                  </label>
                  
                  <div className="mt-2 flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="w-24 h-16 rounded-xl bg-white flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden shadow-sm">
                      {settingsForm.coverURL ? (
                        <img src={settingsForm.coverURL} alt="Cover preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-slate-400 text-[10px] uppercase font-semibold">No Cover</span>
                      )}
                    </div>
                    
                    <div className="flex-1 text-left">
                      <p className="text-slate-500 text-xs">Upload a pristine wide landscape shot of your restaurant to serve as the modern background of your customer menu banner.</p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <label className="py-2 px-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1">
                          <Upload className="w-3.5 h-3.5 text-slate-500" /> Upload Cover Photo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'cover')}
                            className="hidden"
                          />
                        </label>
                        {settingsForm.coverURL && (
                          <button
                            type="button"
                            onClick={() => setSettingsForm(prev => ({ ...prev, coverURL: '' }))}
                            className="py-2 px-3 text-rose-500 hover:bg-rose-50 rounded-lg text-xs font-semibold"
                          >
                            Clear Cover Photo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs tracking-wider uppercase rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 hover:cursor-pointer disabled:bg-slate-200 disabled:text-slate-400"
                    id="save-branding-btn"
                  >
                    {saveLoading ? 'Storing Settings Plan...' : 'Apply Core Branding Properties'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
      </main>

      {/* MODAL SHEET A: MENU RECIPE CRUD MODAL */}
      <AnimatePresence>
        {itemModalOpen && (
          <div className="fixed inset-0 bg-black/65 z-50 flex items-center justify-center px-4 overflow-y-auto pt-6 pb-6 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setItemModalOpen(false);
                resetItemForm();
              }}
              className="absolute inset-0"
            />
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-2xl relative z-10 border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="py-4 px-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h3 className="font-sans font-bold text-base text-slate-900">
                  {editingItem ? 'Adjust Gourmet Recipe Parameters' : 'Publish New Gourmet Delicacy'}
                </h3>
                <button
                  onClick={() => {
                    setItemModalOpen(false);
                    resetItemForm();
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-650 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                  id="close-item-modal"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handleItemSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-600 text-[10px] uppercase font-bold tracking-widest block mb-1.5 pl-0.5">
                      Dish/Recipe Title Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Wagyu Brioche"
                      value={itemForm.name}
                      onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 text-[10px] uppercase font-bold tracking-widest block mb-1.5 pl-0.5">
                      Culinary Retailing Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="24.50"
                      value={itemForm.price}
                      onChange={(e) => setItemForm(prev => ({ ...prev, price: e.target.value }))}
                      required
                      className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-600 text-[10px] uppercase font-bold tracking-widest block mb-1.5 pl-0.5">
                      Assign Nav Section Category
                    </label>
                    <select
                      value={itemForm.categoryId}
                      onChange={(e) => setItemForm(prev => ({ ...prev, categoryId: e.target.value }))}
                      required
                      className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="" disabled>Select collection category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.categoryName}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-600 text-[10px] uppercase font-bold tracking-widest block mb-1.5 pl-0.5">
                      Kitchen Stock Status
                    </label>
                    <div className="flex items-center gap-2 mt-2 h-9 pl-1">
                      <input
                        type="checkbox"
                        id="availability-check"
                        checked={itemForm.availability}
                        onChange={(e) => setItemForm(prev => ({ ...prev, availability: e.target.checked }))}
                        className="w-4 h-4 text-emerald-600 bg-slate-50 border-slate-200 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                      />
                      <label htmlFor="availability-check" className="text-slate-600 text-xs font-semibold select-none cursor-pointer">
                        Active & In Stock (Available for guest preview)
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-slate-600 text-[10px] uppercase font-bold tracking-widest block mb-1.5 pl-0.5">
                    Exquisite Gastronomic Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe ingredient components, cooking metrics, allergen alerts etc."
                    value={itemForm.description}
                    onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div>
                  <label className="text-slate-600 text-[10px] uppercase font-bold tracking-widest block mb-1.5 pl-0.5">
                    Dietary Info Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mt-1 pl-0.5 animate-in fade-in duration-200">
                    {['Vegan', 'Gluten-Free', 'Spicy', 'Vegetarian', 'Nut-Free', 'Dairy-Free'].map((tag) => {
                      const isSelected = itemForm.dietaryTags?.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setItemForm(prev => {
                              const tags = prev.dietaryTags || [];
                              const newTags = tags.includes(tag)
                                ? tags.filter(t => t !== tag)
                                : [...tags, tag];
                              return { ...prev, dietaryTags: newTags };
                            });
                          }}
                          className={`py-1.5 px-3 rounded-lg text-[10px] font-bold tracking-wide transition-all border ${
                            isSelected
                              ? tag === 'Vegan' || tag === 'Vegetarian'
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                : tag === 'Spicy'
                                ? 'bg-rose-50 border-rose-300 text-rose-705 text-rose-700'
                                : 'bg-amber-50 border-amber-300 text-amber-700'
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-slate-600 text-[10px] uppercase font-bold tracking-widest block mb-1.5 pl-0.5">
                    Dish Visual Cover Photo
                  </label>

                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden shrink-0 shadow-xs">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Recipe upload preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center font-sans text-[10px] uppercase tracking-wider text-slate-400 font-bold">No Img</div>
                      )}
                    </div>

                    <div className="flex-1 text-left">
                      <p className="text-slate-500 text-[10px] leading-relaxed">
                        Attach a high quality recipe file photo. In-browser sandbox compiles photos instantly.
                      </p>
                      
                      <div className="mt-2.5 flex items-center gap-2">
                        <label className="py-1.5 px-3.5 bg-white hover:bg-slate-550 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1">
                          <Upload className="w-3.5 h-3.5 text-slate-500" /> Upload File
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'item')}
                            className="hidden"
                          />
                        </label>
                        {imagePreview && (
                          <button
                            type="button"
                            onClick={() => {
                              setItemForm(prev => ({ ...prev, imageURL: '' }));
                              setImagePreview('');
                            }}
                            className="text-[11px] font-semibold text-rose-500 hover:bg-rose-50 px-2 py-1 rounded-md"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setItemModalOpen(false);
                      resetItemForm();
                    }}
                    className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 border border-slate-200/60 rounded-xl text-slate-650 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel Action
                  </button>
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wide uppercase rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    {saveLoading ? 'Writing Record...' : editingItem ? 'Apply Updates' : 'Publish Dish'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL SHEET B: CATEGORY COLLECTION CRUD MODAL */}
      <AnimatePresence>
        {categoryModalOpen && (
          <div className="fixed inset-0 bg-black/65 z-50 flex items-center justify-center px-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setCategoryModalOpen(false);
                resetCategoryForm();
              }}
              className="absolute inset-0"
            />
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-2xl relative z-10 border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="py-4 px-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h3 className="font-sans font-bold text-base text-slate-900">
                  {editingCategory ? 'Update Collection Category' : 'Formulate New Category'}
                </h3>
                <button
                  onClick={() => {
                    setCategoryModalOpen(false);
                    resetCategoryForm();
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-650 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                  id="close-cat-modal"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
                <div>
                  <label className="text-slate-600 text-[10px] uppercase font-bold tracking-widest block mb-1.5 pl-0.5">
                    Category Title Designation
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Signature Entrées"
                    value={categoryForm.categoryName}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, categoryName: e.target.value }))}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-600 text-[10px] uppercase font-bold tracking-widest block mb-1.5 pl-0.5">
                    Collection Highlight Text Tagline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Exquisite slow-cooked masterpieces."
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryModalOpen(false);
                      resetCategoryForm();
                    }}
                    className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 border border-slate-200/60 rounded-xl text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wide uppercase rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    {saveLoading ? 'Saving...' : editingCategory ? 'Update Section' : 'Create Section'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
