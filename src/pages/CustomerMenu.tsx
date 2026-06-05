import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  MapPin,
  Phone,
  X,
  Check,
  AlertCircle,
  SlidersHorizontal,
  Clock,
  Star,
  Sparkles,
} from "lucide-react";
import { dbService } from "../services/db";
import { Category, MenuItem, RestaurantInfo } from "../types/menu";

export default function CustomerMenu() {
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter panel state
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [availableOnly, setAvailableOnly] = useState<boolean>(false);
  const [priceSort, setPriceSort] = useState<"none" | "asc" | "desc">("none");
  const [panelCategory, setPanelCategory] = useState<string>("all");
  const [panelAvailableOnly, setPanelAvailableOnly] = useState<boolean>(false);
  const [panelPriceSort, setPanelPriceSort] = useState<"none" | "asc" | "desc">(
    "none",
  );

  // Customization selection helper states
  const [spiceLevel, setSpiceLevel] = useState<
    "Mild" | "Medium" | "Hot" | "Imperial"
  >("Medium");
  const [addOns, setAddOns] = useState<string[]>([]);
  const [showCustomSuccess, setShowCustomSuccess] = useState<boolean>(false);

  useEffect(() => {
    async function loadMenuData() {
      try {
        const [infoStr, catsStr, itemsStr] = await Promise.all([
          dbService.getRestaurantInfo(),
          dbService.getCategories(),
          dbService.getMenuItems(),
        ]);
        setRestaurant(infoStr);
        setCategories(catsStr);
        setMenuItems(itemsStr);
      } catch (err) {
        console.error("Failed loading public menu", err);
      } finally {
        setLoading(false);
      }
    }
    loadMenuData();
  }, []);

  // Filter items matching active category + querying text + availability + sorting
  const baseFiltered = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" || item.categoryId === selectedCategory;
    const matchesKeyword =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAvailability = !availableOnly || item.availability;
    return matchesCategory && matchesKeyword && matchesAvailability;
  });

  const filteredItems = (() => {
    const copy = baseFiltered.slice();
    if (priceSort === "asc") {
      copy.sort((a, b) => a.price - b.price);
    } else if (priceSort === "desc") {
      copy.sort((a, b) => b.price - a.price);
    }
    return copy;
  })();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F6F7F9] px-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          className="w-14 h-14 border-4 border-[#1C1C1E] border-t-[#2ECC71] rounded-full mb-4 shadow"
        />
        <h2 className="text-xl font-display font-bold text-[#1C1C1E] tracking-wider animate-pulse">
          Crafting Heritage Experience...
        </h2>
        <p className="font-sans text-xs text-slate-500 mt-1.5 uppercase tracking-widest font-semibold">
          Setting Gastronomy Panels
        </p>
      </div>
    );
  }

  const initialLetter = restaurant?.name ? restaurant.name.charAt(0) : "T";

  // Toggle add-on checkbox
  const toggleAddOn = (addon: string) => {
    if (addOns.includes(addon)) {
      setAddOns((prev) => prev.filter((item) => item !== addon));
    } else {
      setAddOns((prev) => [...prev, addon]);
    }
  };

  const handleApplyCustomizations = () => {
    setShowCustomSuccess(true);
    setTimeout(() => {
      setShowCustomSuccess(false);
      setSelectedItem(null);
      setAddOns([]);
      setSpiceLevel("Medium");
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-[#F6F7F9] text-[#1C1C1E] flex flex-col items-center select-none font-sans antialiased">
      {/* Mobile Frame Container: Limit width to resemble a premium app on widescreen/mobile */}
      <div className="w-full max-w-md bg-[#F6F7F9] min-h-screen shadow-2xl shadow-slate-350/40 flex flex-col relative border-x border-[#ECEFF1] pb-12 overflow-hidden">
        <div className="flex flex-col">
          {/* Elegant Header Hero */}
          <div className="relative min-h-[290px] flex flex-col justify-end overflow-hidden pb-4">
            {/* Cover Photo */}
            {restaurant?.coverURL ? (
              <div className="absolute inset-0 z-0">
                <img
                  src={restaurant.coverURL}
                  alt={`${restaurant.name} banner`}
                  className="w-full h-full object-cover transform scale-102 hover:scale-105 transition-transform duration-700 pointer-events-none"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#1c1c1e]/40 via-[#1c1c1e]/70 to-[#f6f7f9]" />
              </div>
            ) : (
              <div className="absolute inset-0 bg-[#1C1C1E] z-0">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#2ECC71]/10 rounded-full blur-2xl animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#1C1C1E]/60 via-[#1C1C1E]/85 to-[#f6f7f9]" />
              </div>
            )}

            {/* Banner content */}
            <div className="relative z-10 pt-8 px-6 flex flex-col gap-4">
              {/* Brand Identity */}
              <div className="flex items-center gap-3">
                {restaurant?.logoURL ? (
                  <div className="relative p-0.5 bg-white/10 rounded-2xl ring-4 ring-[#2ECC71]/20 shadow-2xl backdrop-blur-md">
                    <img
                      src={restaurant.logoURL}
                      alt={`${restaurant.name} logo`}
                      className="w-14 h-14 rounded-[14px] object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1C1C1E] via-[#2d2d2d] to-[#1C1C1E] flex items-center justify-center font-serif text-2xl font-black text-[#2ECC71] shadow-2xl border border-white/20 ring-4 ring-white/15">
                    {initialLetter}
                  </div>
                )}

                <div className="flex-1">
                  <span className="inline-flex items-center gap-1.5 text-[8px] tracking-[0.25em] uppercase font-black text-[#2ECC71] bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 mb-1 w-max">
                    <span className="w-1.5 h-1.5 bg-[#2ECC71] rounded-full animate-ping" />{" "}
                    Live Gastronomy Menu
                  </span>
                  <h1 className="text-2xl font-serif font-black text-white leading-none tracking-wide drop-shadow-md">
                    {restaurant?.name || "The Saffron Heritage"}
                  </h1>
                </div>
              </div>

              {/* Elegant White Detail Card */}
              <div className="bg-white/80 backdrop-blur-md border border-white/40 shadow-xl rounded-2xl p-4 space-y-3 mt-1.5 transform hover:scale-[1.01] transition-transform duration-300">
                {restaurant?.address && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#2ECC71] shrink-0 mt-0.5" />
                    <span className="text-[11px] font-medium tracking-wide text-gray-700 leading-relaxed">
                      {restaurant.address}
                    </span>
                  </div>
                )}
                {restaurant?.contactNumber && (
                  <div className="flex items-center justify-between border-t border-slate-250/30 pt-2.5">
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-3.5 h-3.5 text-[#2ECC71] shrink-0" />
                      <a
                        href={`tel:${restaurant.contactNumber}`}
                        className="text-[11px] font-mono tracking-wider font-bold text-slate-850 hover:text-emerald-700 transition-colors"
                      >
                        {restaurant.contactNumber}
                      </a>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                      <Clock className="w-3 h-3 text-emerald-600" /> Open Today
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Floating Search Bar */}
          <div className="px-4 sticky top-0 z-20 pb-3 -mt-1 bg-gradient-to-b from-[#F6F7F9]/85 to-[#F6F7F9] backdrop-blur-md pt-2">
            <div className="flex items-center gap-2">
              <div className="relative flex items-center bg-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.02)] border border-slate-200/60 overflow-hidden pl-3.5 flex-1">
                <Search className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search delicacies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-3.5 px-3 text-sm text-[#1C1C1E] focus:outline-none placeholder-slate-400 font-sans"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="p-3 text-slate-400 hover:text-[#1C1C1E] transition-colors"
                    id="clear-search-btn"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filter Panel Button */}
              <button
                onClick={() => {
                  setPanelCategory(selectedCategory || "all");
                  setPanelAvailableOnly(availableOnly);
                  setPanelPriceSort(priceSort);
                  setShowFilters(true);
                }}
                className="p-3.5 bg-white border border-slate-200/60 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.02)] text-slate-500 hover:text-[#1C1C1E] transition-all hover:bg-slate-50 active:scale-95"
                title="Reset Filters"
                id="filter-sliders-btn"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category Horizontal Filter Pills */}
          <div className="px-4 mt-1.5 sticky top-[68px] z-10 bg-[#F6F7F9] py-2">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1.5">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4.5 py-2.5 rounded-full text-[11px] font-bold tracking-wider whitespace-nowrap transition-all uppercase duration-300 ${
                  selectedCategory === "all"
                    ? "bg-[#1C1C1E] text-white shadow-md shadow-[#1C1C1E]/20 scale-102 font-extrabold"
                    : "bg-[#ECEFF1] text-[#4B5563] border border-slate-200/50 hover:bg-slate-200"
                }`}
                id="filter-category-all"
              >
                All Delights
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4.5 py-2.5 rounded-full text-[11px] font-bold tracking-wider whitespace-nowrap transition-all uppercase duration-300 ${
                    selectedCategory === cat.id
                      ? "bg-[#1C1C1E] text-white shadow-md shadow-[#1C1C1E]/20 scale-102 font-extrabold"
                      : "bg-[#ECEFF1] text-[#4B5563] border border-slate-200/50 hover:bg-slate-200"
                  }`}
                  id={`filter-category-${cat.id}`}
                >
                  {cat.categoryName}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Category Description Note */}
          {selectedCategory !== "all" && (
            <div className="px-4 pt-1 pb-2">
              <div className="bg-white/60 p-3.5 rounded-xl border border-slate-200/40 text-xs italic text-slate-500 font-sans tracking-wide">
                ✨{" "}
                {categories.find((c) => c.id === selectedCategory)?.description}
              </div>
            </div>
          )}

          {/* Premium Stacked Cards Container */}
          <div className="relative mt-3 px-4 pb-16">
            <div className="absolute top-0 left-9 right-9 h-12 bg-white/30 border border-slate-200/40 rounded-3xl z-0 transform -translate-y-3.5 scale-[0.93] shadow-xs" />
            <div className="absolute top-0 left-7 right-7 h-12 bg-white/75 border border-slate-200/50 rounded-3xl z-5 transform -translate-y-1.5 scale-[0.97] shadow-sm" />

            <div className="relative z-10 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/50 p-4 shadow-xl shadow-slate-300/30 space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredItems.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="py-16 px-4 text-center"
                  >
                    <div className="w-16 h-16 bg-slate-50 border border-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <AlertCircle className="w-8 h-8 text-slate-350" />
                    </div>
                    <h3 className="font-serif font-black text-lg text-slate-800 tracking-wide">
                      No delicacies aligned
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 max-w-[240px] mx-auto leading-relaxed">
                      We could not find items matching your search. Explore
                      other collections or reset filters.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("all");
                      }}
                      className="mt-6 px-6 py-2.5 bg-[#1C1C1E] text-white text-[10px] tracking-wider uppercase font-black rounded-xl shadow-md active:scale-95 transition-all"
                      id="reset-filters-btn"
                    >
                      Reset Ledger List
                    </button>
                  </motion.div>
                ) : (
                  filteredItems.map((item, idx) => {
                    const categoryRelation = categories.find(
                      (c) => c.id === item.categoryId,
                    );
                    const isVegetarian =
                      item.name.toLowerCase().includes("paneer") ||
                      item.name.toLowerCase().includes("kesar");

                    return (
                      <motion.div
                        key={item.id}
                        layoutId={`food-card-${item.id}`}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          transition: { delay: idx * 0.05 },
                        }}
                        whileTap={{ scale: item.availability ? 0.98 : 1 }}
                        onClick={() => {
                          if (item.availability) {
                            setSpiceLevel("Medium");
                            setAddOns([]);
                            setSelectedItem(item);
                          }
                        }}
                        className={`bg-[#F9FAFB]/90 hover:bg-white rounded-2xl border border-slate-200/50 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-lg hover:border-[#2ECC71]/20 transition-all duration-300 p-3.5 cursor-pointer ${
                          !item.availability
                            ? "opacity-55 grayscale bg-slate-100"
                            : ""
                        }`}
                      >
                        <div className="flex gap-4">
                          {/* Dish Avatar */}
                          <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-100 relative shadow-inner border border-slate-200/30">
                            {item.imageURL ? (
                              <img
                                src={item.imageURL}
                                alt={item.name}
                                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 font-serif text-xl font-bold">
                                {item.name.charAt(0)}
                              </div>
                            )}
                            {!item.availability && (
                              <span className="absolute inset-0 bg-black/65 text-[8px] tracking-widest text-white font-black flex items-center justify-center uppercase">
                                Sold Out
                              </span>
                            )}
                          </div>

                          {/* Content details */}
                          <div className="flex-1 flex flex-col justify-between min-w-0">
                            <div>
                              <div className="flex items-start justify-between gap-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {/* Veg/Non-veg Dot */}
                                  <span
                                    className={`w-3 h-3 shrink-0 rounded-sm border flex items-center justify-center p-0.5 ${isVegetarian ? "border-emerald-600" : "border-rose-600"}`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${isVegetarian ? "bg-emerald-600" : "bg-[#E11D48]"}`}
                                    />
                                  </span>
                                  <h4 className="font-display font-bold text-[#1C1C1E] text-sm leading-tight truncate">
                                    {item.name}
                                  </h4>
                                </div>
                                <span className="font-display font-extrabold text-[13px] text-[#1C1C1E] shrink-0 bg-slate-100/80 px-2 py-0.5 rounded-lg border border-slate-200/40">
                                  ₹{item.price.toFixed(2)}
                                </span>
                              </div>
                              <p className="text-slate-500 text-[11px] mt-1.5 line-clamp-2 leading-relaxed">
                                {item.description}
                              </p>

                              {/* Dietary Option Tags */}
                              {item.dietaryTags &&
                                item.dietaryTags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {item.dietaryTags.map((tag) => {
                                      let tagStyle =
                                        "bg-slate-50 text-slate-600 border-slate-200";
                                      if (
                                        tag === "Vegan" ||
                                        tag === "Vegetarian"
                                      ) {
                                        tagStyle =
                                          "bg-[#EEFDF4] text-[#16A34A] border-[#DCFCE7]";
                                      } else if (tag === "Spicy") {
                                        tagStyle =
                                          "bg-[#FFF1F2] text-[#E11D48] border-[#FFE4E6]";
                                      } else if (tag === "Gluten-Free") {
                                        tagStyle =
                                          "bg-[#FFFBEB] text-[#D97706] border-[#FEF3C7]";
                                      } else if (tag === "Dairy-Free") {
                                        tagStyle =
                                          "bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE]";
                                      } else if (tag === "Nut-Free") {
                                        tagStyle =
                                          "bg-[#FAF5FF] text-[#9333EA] border-[#F3E8FF]";
                                      }
                                      return (
                                        <span
                                          key={tag}
                                          className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded border inline-flex items-center gap-0.5 shrink-0 ${tagStyle}`}
                                        >
                                          {tag}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                            </div>

                            {categoryRelation && (
                              <div className="mt-2 text-[9px] flex items-center justify-between text-slate-400 pt-1">
                                <span className="bg-slate-200/70 text-slate-600 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                  {categoryRelation.categoryName}
                                </span>
                                {item.availability && (
                                  <span className="text-[#2ECC71] font-black uppercase tracking-wider flex items-center gap-0.5 text-[8px]">
                                    <Check className="w-3 h-3 text-[#2ECC71]" />{" "}
                                    Chef Choice
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Dynamic Detail Modal */}
        <AnimatePresence>
          {selectedItem && (
            <div className="fixed inset-0 bg-black/75 z-50 flex items-end justify-center px-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  if (!showCustomSuccess) setSelectedItem(null);
                }}
                className="absolute inset-0"
              />
              <motion.div
                layoutId={`food-card-${selectedItem.id}`}
                className="bg-white w-full max-w-sm rounded-t-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh] pb-6 border border-slate-100"
              >
                {/* Backdrop / Image view */}
                <div className="h-56 w-full relative bg-[#1c1c1e]">
                  {selectedItem.imageURL ? (
                    <img
                      src={selectedItem.imageURL}
                      alt={selectedItem.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-[#2ECC71] font-serif text-3xl font-black">
                      {selectedItem.name.charAt(0)}
                    </div>
                  )}
                  {/* Subtle grand overlay gradient */}
                  <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                  {/* Close button */}
                  <button
                    onClick={() => {
                      if (!showCustomSuccess) setSelectedItem(null);
                    }}
                    disabled={showCustomSuccess}
                    className="absolute top-4 right-4 bg-black/45 hover:bg-black/80 backdrop-blur-md p-2 rounded-full text-white transition-all shadow-md active:scale-90"
                    id="close-drawer-btn"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>

                  <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                    <div className="min-w-0 pr-4">
                      <span className="text-[9px] uppercase font-black text-[#2ECC71] tracking-widest block mb-1">
                        {categories.find(
                          (c) => c.id === selectedItem.categoryId,
                        )?.categoryName || "Chef Collection"}
                      </span>
                      <h3 className="font-serif font-black text-white text-lg tracking-wide leading-tight truncate">
                        {selectedItem.name}
                      </h3>
                    </div>
                    <span className="font-display font-extrabold text-[#2ECC71] text-base py-1 px-3.5 rounded-xl bg-[#1C1C1E]/80 backdrop-blur-sm border border-white/10 shrink-0">
                      ₹{selectedItem.price.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Info & Customization details list */}
                <div className="p-5 overflow-y-auto space-y-5 no-scrollbar max-h-[50vh]">
                  {showCustomSuccess ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-10 text-center space-y-4"
                    >
                      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
                        <Check className="w-8 h-8 text-[#2ECC71]" />
                      </div>
                      <h4 className="font-display font-black text-slate-800 text-base">
                        Customization Confirmed
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-[220px] mx-auto">
                        Your preparation preferences have been compiled for this
                        digital card menu review.
                      </p>
                    </motion.div>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span className="text-[10px] text-slate-400 font-bold ml-1.5 uppercase tracking-wider font-display">
                            Rating (4.9)
                          </span>
                        </div>

                        {selectedItem.dietaryTags &&
                          selectedItem.dietaryTags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {selectedItem.dietaryTags.map((tag) => {
                                let tagStyle =
                                  "bg-slate-50 text-slate-600 border-slate-200";
                                if (tag === "Vegan" || tag === "Vegetarian") {
                                  tagStyle =
                                    "bg-[#EEFDF4] text-[#16A34A] border-[#DCFCE7]";
                                } else if (tag === "Spicy") {
                                  tagStyle =
                                    "bg-[#FFF1F2] text-[#E11D48] border-[#FFE4E6]";
                                } else if (tag === "Gluten-Free") {
                                  tagStyle =
                                    "bg-[#FFFBEB] text-[#D97706] border-[#FEF3C7]";
                                } else if (tag === "Dairy-Free") {
                                  tagStyle =
                                    "bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE]";
                                } else if (tag === "Nut-Free") {
                                  tagStyle =
                                    "bg-[#FAF5FF] text-[#9333EA] border-[#F3E8FF]";
                                }
                                return (
                                  <span
                                    key={tag}
                                    className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded border inline-flex items-center gap-0.5 shrink-0 ${tagStyle}`}
                                  >
                                    {tag}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        <p className="text-slate-500 text-[11px] leading-relaxed font-sans mt-1">
                          {selectedItem.description}
                        </p>
                      </div>

                      {/* Interactive Selection 1: Spice Levels */}
                      <div className="space-y-2 border-t border-slate-100 pt-3.5">
                        <span className="block text-[9px] uppercase tracking-widest font-black text-slate-400">
                          Specify Spice Intensity
                        </span>
                        <div className="grid grid-cols-4 gap-2">
                          {(["Mild", "Medium", "Hot", "Imperial"] as const).map(
                            (level) => (
                              <button
                                key={level}
                                type="button"
                                onClick={() => setSpiceLevel(level)}
                                className={`py-2 px-1.5 rounded-lg text-[10px] font-bold text-center leading-none transition-all uppercase border ${
                                  spiceLevel === level
                                    ? "bg-[#1C1C1E] border-[#1C1C1E] text-white shadow"
                                    : "bg-[#F6F7F9] border-slate-205/60 text-slate-500 hover:bg-slate-100"
                                }`}
                              >
                                {level}
                              </button>
                            ),
                          )}
                        </div>
                      </div>

                      {/* Interactive Selection 2: Add-on checkboxes */}
                      <div className="space-y-2 border-t border-slate-100 pt-3.5">
                        <span className="block text-[9px] uppercase tracking-widest font-black text-slate-400">
                          Optional Enrichments
                        </span>
                        <div className="space-y-2 text-xs">
                          {[
                            "Extra Rich Cashew Gravy (+₹45.00)",
                            "Melted Butter Brushed (+₹20.00)",
                            "Gluten-Free Flour Preparation",
                            "No Onion No Garlic Composition",
                          ].map((addon) => {
                            const isChecked = addOns.includes(addon);
                            return (
                              <label
                                key={addon}
                                onClick={() => toggleAddOn(addon)}
                                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/50 hover:bg-slate-50 cursor-pointer transition-all active:scale-[0.99]"
                              >
                                <span className="text-[11px] font-medium text-slate-600 truncate">
                                  {addon}
                                </span>
                                <span
                                  className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center shrink-0 ${
                                    isChecked
                                      ? "border-emerald-600 bg-emerald-600 text-white"
                                      : "border-slate-300 bg-white"
                                  }`}
                                >
                                  {isChecked && (
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  )}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={handleApplyCustomizations}
                          className="w-full py-3.5 bg-[#1C1C1E] hover:bg-[#2d2d2d] active:scale-98 text-white font-black text-[10px] rounded-xl tracking-widest uppercase transition-all shadow-md mt-1"
                          id="submit-customizations-btn"
                        >
                          Confirm Preferences
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Filter Panel - mobile friendly slide-up */}
        <AnimatePresence>
          {showFilters && (
            <div className="fixed inset-0 z-50 flex items-end justify-center px-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowFilters(false)}
                className="absolute inset-0 bg-black/40"
              />
              <motion.div
                initial={{ y: 300 }}
                animate={{ y: 0 }}
                exit={{ y: 300 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-full max-w-md bg-white rounded-t-3xl overflow-hidden shadow-2xl relative z-10 pb-6 border border-slate-100"
              >
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-display font-extrabold">
                    Filters
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowFilters(false)}
                      className="p-2 rounded-full bg-slate-50 hover:bg-slate-100"
                      aria-label="Close filters"
                    >
                      <X className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {/* Category selector */}
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-black text-slate-400 mb-2">
                      Category
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setPanelCategory("all")}
                        className={`px-3 py-2 rounded-full text-[12px] font-bold ${panelCategory === "all" ? "bg-[#1C1C1E] text-white" : "bg-[#ECEFF1] text-[#4B5563]"}`}
                      >
                        All
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setPanelCategory(cat.id)}
                          className={`px-3 py-2 rounded-full text-[12px] font-bold ${panelCategory === cat.id ? "bg-[#1C1C1E] text-white" : "bg-[#ECEFF1] text-[#4B5563]"}`}
                        >
                          {cat.categoryName}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Availability */}
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-black text-slate-400 mb-2">
                      Availability
                    </div>
                    <label className="flex items-center gap-3 p-2 rounded-xl border border-slate-200/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={panelAvailableOnly}
                        onChange={(e) =>
                          setPanelAvailableOnly(e.target.checked)
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        Show available items only
                      </span>
                    </label>
                  </div>

                  {/* Price Sort */}
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-black text-slate-400 mb-2">
                      Sort by price
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-3 p-2 rounded-xl border border-slate-200/50 cursor-pointer">
                        <input
                          type="radio"
                          name="priceSort"
                          checked={panelPriceSort === "none"}
                          onChange={() => setPanelPriceSort("none")}
                        />
                        <span className="text-sm font-medium text-slate-700">
                          None
                        </span>
                      </label>
                      <label className="flex items-center gap-3 p-2 rounded-xl border border-slate-200/50 cursor-pointer">
                        <input
                          type="radio"
                          name="priceSort"
                          checked={panelPriceSort === "asc"}
                          onChange={() => setPanelPriceSort("asc")}
                        />
                        <span className="text-sm font-medium text-slate-700">
                          Low to High
                        </span>
                      </label>
                      <label className="flex items-center gap-3 p-2 rounded-xl border border-slate-200/50 cursor-pointer">
                        <input
                          type="radio"
                          name="priceSort"
                          checked={panelPriceSort === "desc"}
                          onChange={() => setPanelPriceSort("desc")}
                        />
                        <span className="text-sm font-medium text-slate-700">
                          High to Low
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        // Apply panel selections to active filters
                        setSelectedCategory(panelCategory || "all");
                        setAvailableOnly(panelAvailableOnly);
                        setPriceSort(panelPriceSort);
                        setShowFilters(false);
                      }}
                      className="flex-1 py-3 bg-[#1C1C1E] text-white font-black text-[12px] rounded-xl"
                      id="apply-filters-btn"
                    >
                      Apply Filters
                    </button>
                    <button
                      onClick={() => {
                        // Reset filters both in panel and active
                        setPanelCategory("all");
                        setSelectedCategory("all");
                        setPanelAvailableOnly(false);
                        setAvailableOnly(false);
                        setPanelPriceSort("none");
                        setPriceSort("none");
                        setShowFilters(false);
                      }}
                      className="py-3 px-4 bg-white border border-slate-200/60 rounded-xl text-slate-700 font-bold"
                      id="reset-panel-filters-btn"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Outer Credit line */}
        <div className="text-center text-[8px] text-slate-350 uppercase tracking-widest font-bold py-6 border-t border-[#ECEFF1] bg-white">
          The Saffron Heritage Est. 1999
        </div>
      </div>
    </div>
  );
}
