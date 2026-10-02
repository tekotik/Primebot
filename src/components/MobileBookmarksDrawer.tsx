import React, { useState, useEffect } from 'react';
import {
  X,
  Bookmark,
  Trash2,
  Share2,
  FolderPlus,
  Folder,
  FolderOpen,
  Bell,
  BellRing,
  Check,
  CheckSquare,
  Plus,
  ChevronRight,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { CarLot, ClientFolder, Currency } from '../types/car';
import { formatPrice, formatRubDirect } from '../utils/currency';
import { TimedCountdownBadge } from './TimedCountdownBadge';

interface MobileBookmarksDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lots: CarLot[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onSelect: (lot: CarLot) => void;
  currency: Currency;
  folders?: ClientFolder[];
  onUpdateFolders?: (folders: ClientFolder[]) => void;
}

const DEFAULT_FOLDERS: ClientFolder[] = [
  {
    id: 'folder-sergey',
    name: 'Сергей',
    createdAt: Date.now() - 3600000,
    lotIds: ['lot-892104'],
    notificationsEnabled: false
  },
  {
    id: 'folder-alex',
    name: 'Алексей',
    createdAt: Date.now() - 7200000,
    lotIds: [],
    notificationsEnabled: false
  }
];

export const MobileBookmarksDrawer: React.FC<MobileBookmarksDrawerProps> = ({
  isOpen,
  onClose,
  lots,
  onRemove,
  onClear,
  onSelect,
  currency,
  folders: externalFolders,
  onUpdateFolders
}) => {
  // Folders state persisted in localStorage and synced with externalFolders
  const [folders, setFolders] = useState<ClientFolder[]>(() => {
    if (externalFolders && externalFolders.length > 0) return externalFolders;
    try {
      const saved = localStorage.getItem('prime_client_folders');
      return saved ? JSON.parse(saved) : DEFAULT_FOLDERS;
    } catch {
      return DEFAULT_FOLDERS;
    }
  });

  useEffect(() => {
    if (externalFolders) {
      setFolders(externalFolders);
    }
  }, [externalFolders]);

  const setFoldersAndNotify = (action: React.SetStateAction<ClientFolder[]>) => {
    setFolders((prev) => {
      const updated = typeof action === 'function' ? action(prev) : action;
      if (onUpdateFolders) {
        onUpdateFolders(updated);
      }
      return updated;
    });
  };

  const [activeFolderId, setActiveFolderId] = useState<string>('all'); // 'all' | 'unassigned' | folder.id
  const [selectedLotIds, setSelectedLotIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [flyingLotIds, setFlyingLotIds] = useState<Set<string>>(new Set());
  const [targetPulsingFolderId, setTargetPulsingFolderId] = useState<string | null>(null);

  // Quick single card folder assign modal
  const [quickAssignLotId, setQuickAssignLotId] = useState<string | null>(null);

  // Folder creation modal state
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isMultiFolderPickerOpen, setIsMultiFolderPickerOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Save folders to localStorage
  useEffect(() => {
    localStorage.setItem('prime_client_folders', JSON.stringify(folders));
  }, [folders]);

  // Toast auto-clear
  useEffect(() => {
    if (toastNotification) {
      const t = setTimeout(() => setToastNotification(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toastNotification]);

  if (!isOpen) return null;

  // Active folder object if a client folder is chosen
  const activeFolder = folders.find((f) => f.id === activeFolderId);

  // Filter lots based on active folder
  const displayedLots = lots.filter((lot) => {
    if (activeFolderId === 'all') return true;
    if (activeFolderId === 'unassigned') {
      return !folders.some((f) => f.lotIds.includes(lot.id));
    }
    return activeFolder?.lotIds.includes(lot.id);
  });

  const totalUsd = displayedLots.reduce((acc, l) => acc + (l.currentBidUsd || 0), 0);
  const totalRub = displayedLots.reduce((acc, l) => acc + l.estTurnkeyRub, 0);

  // Toggle selection
  const handleToggleSelectCard = (lotId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLotIds((prev) => {
      const next = new Set(prev);
      if (next.has(lotId)) next.delete(lotId);
      else next.add(lotId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedLotIds.size === displayedLots.length) {
      setSelectedLotIds(new Set());
    } else {
      setSelectedLotIds(new Set(displayedLots.map((l) => l.id)));
    }
  };

  // Move selected lots to folder
  const handleMoveSelectedToFolder = (targetFolderId: string) => {
    const lotIdsToMove = quickAssignLotId ? [quickAssignLotId] : Array.from(selectedLotIds);
    if (lotIdsToMove.length === 0) return;

    const movingIds = new Set(lotIdsToMove);
    const targetFolder = folders.find((f) => f.id === targetFolderId);
    if (!targetFolder) return;

    setFlyingLotIds(movingIds);
    setTargetPulsingFolderId(targetFolderId);

    setTimeout(() => {
      setFoldersAndNotify((prev) =>
        prev.map((f) => {
          if (f.id === targetFolderId) {
            const combined = Array.from(new Set([...f.lotIds, ...Array.from(movingIds)]));
            return { ...f, lotIds: combined };
          }
          return {
            ...f,
            lotIds: f.lotIds.filter((id) => !movingIds.has(id))
          };
        })
      );

      setFlyingLotIds(new Set());
      setSelectedLotIds(new Set());
      setQuickAssignLotId(null);
      setIsSelectionMode(false);
      setIsMultiFolderPickerOpen(false);
      setTargetPulsingFolderId(null);

      setActiveFolderId(targetFolderId);
      setToastNotification(`Лоты перемещены в папку «${targetFolder.name}»`);
    }, 380);
  };

  // Create folder
  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) return;

    const lotIdsToMove = quickAssignLotId
      ? [quickAssignLotId]
      : selectedLotIds.size > 0
      ? Array.from(selectedLotIds)
      : [];

    const newFolder: ClientFolder = {
      id: `folder-${Date.now()}`,
      name: trimmed,
      createdAt: Date.now(),
      lotIds: lotIdsToMove,
      notificationsEnabled: false
    };

    if (lotIdsToMove.length > 0) {
      setFlyingLotIds(new Set(lotIdsToMove));
      setTargetPulsingFolderId(newFolder.id);

      setTimeout(() => {
        setFoldersAndNotify((prev) => [
          ...prev.map((f) => ({
            ...f,
            lotIds: f.lotIds.filter((id) => !lotIdsToMove.includes(id))
          })),
          newFolder
        ]);

        setFlyingLotIds(new Set());
        setSelectedLotIds(new Set());
        setQuickAssignLotId(null);
        setIsSelectionMode(false);
        setNewFolderName('');
        setIsCreateFolderOpen(false);
        setIsMultiFolderPickerOpen(false);
        setTargetPulsingFolderId(null);
        setActiveFolderId(newFolder.id);
        setToastNotification(`Папка «${newFolder.name}» создана`);
      }, 380);
    } else {
      setFoldersAndNotify((prev) => [...prev, newFolder]);
      setNewFolderName('');
      setIsCreateFolderOpen(false);
      setActiveFolderId(newFolder.id);
      setToastNotification(`Папка «${newFolder.name}» создана`);
    }
  };

  // Toggle "Напоминать"
  const handleToggleNotifications = () => {
    if (!activeFolder) return;
    const nextState = !activeFolder.notificationsEnabled;
    setFoldersAndNotify((prev) =>
      prev.map((f) => (f.id === activeFolder.id ? { ...f, notificationsEnabled: nextState } : f))
    );
    if (nextState) {
      setToastNotification(`🔔 Напоминания для «${activeFolder.name}» включены`);
    } else {
      setToastNotification(`Напоминания для «${activeFolder.name}» выключены`);
    }
  };

  // Remove car from folder
  const handleRemoveFromCurrentFolder = (lotId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeFolder) {
      onRemove(lotId);
      return;
    }
    setFoldersAndNotify((prev) =>
      prev.map((f) =>
        f.id === activeFolder.id ? { ...f, lotIds: f.lotIds.filter((id) => id !== lotId) } : f
      )
    );
  };

  // Delete folder
  const handleDeleteFolder = (folderId: string) => {
    const f = folders.find((item) => item.id === folderId);
    if (!f) return;
    if (confirm(`Удалить папку «${f.name}»? Лоты останутся в закладках.`)) {
      setFoldersAndNotify((prev) => prev.filter((item) => item.id !== folderId));
      setActiveFolderId('all');
    }
  };

  // Share client folder
  const handleShareFolder = () => {
    if (!navigator.clipboard) return;
    const folderTitle = activeFolder ? `для клиента ${activeFolder.name}` : 'PrimeAvtoExport';
    const textLines = displayedLots.map((l, i) => {
      const priceText = l.currentBidUsd ? `$${l.currentBidUsd.toLocaleString()}` : 'нет ставок';
      const turnkeyText = `${Math.round(l.estTurnkeyRub / 1000)}k ₽`;
      const condText = l.condition === 'run' ? 'На ходу' : 'Не на ходу';
      return `${i + 1}. ${l.year} ${l.make} ${l.model} [${condText}] (${l.auction.toUpperCase()} #${l.lotId}) — ставка ${priceText}, под ключ ~${turnkeyText}`;
    });

    const shareContent = `🚗 Подборка ${folderTitle} (${displayedLots.length} шт.):\n\n${textLines.join('\n')}\n\nОриентир под ключ: ${formatRubDirect(totalRub, currency)}`;
    navigator.clipboard.writeText(shareContent);
    setToastNotification('Подборка скопирована!');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex flex-col justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-fade-in-fast"
      />

      {/* Drawer */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md mx-auto max-h-[88vh] bg-[#0f131c] border-t border-slate-800 rounded-t-3xl shadow-2xl flex flex-col z-10 animate-slide-up-fast"
      >
        {/* Drag Handle */}
        <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto my-2 shrink-0" />

        {/* Drawer Header */}
        <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-[#068eff] fill-current" />
            <h3 className="text-sm font-bold text-white font-['Exo_2',sans-serif] uppercase tracking-wide">
              Закладки
            </h3>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
              {lots.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {lots.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode);
                  if (isSelectionMode) setSelectedLotIds(new Set());
                }}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                  isSelectionMode
                    ? 'bg-[#068eff] text-white'
                    : 'text-slate-300 bg-slate-800/80 hover:bg-slate-800'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>{isSelectionMode ? 'Готово' : 'Отметить'}</span>
              </button>
            )}

            {displayedLots.length > 0 && (
              <button
                type="button"
                onClick={handleShareFolder}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                title="Поделиться подборкой"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FOLDERS HORIZONTAL BAR (Finger-swipeable without scrollbar) */}
        <div className="relative px-3 py-2 bg-[#101420] border-b border-slate-800/90 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth touch-pan-x overscroll-x-contain select-none py-0.5 px-0.5">
            {/* All */}
            <button
              type="button"
              onClick={() => setActiveFolderId('all')}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 active:scale-95 ${
                activeFolderId === 'all'
                  ? 'bg-[#1e2638] text-white border border-slate-600 shadow-sm'
                  : 'bg-[#131724] text-slate-400 border border-slate-800/80 hover:text-slate-200'
              }`}
            >
              <span>Все</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                {lots.length}
              </span>
            </button>

            {/* Client Folders */}
            {folders.map((f) => {
              const count = lots.filter((l) => f.lotIds.includes(l.id)).length;
              const isActive = activeFolderId === f.id;
              const isTargetPulsing = targetPulsingFolderId === f.id;

              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveFolderId(f.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border active:scale-95 ${
                    isActive
                      ? 'bg-[#068eff]/20 border-[#068eff] text-white shadow-sm ring-1 ring-[#068eff]/30'
                      : 'bg-[#131724] border-slate-800 text-slate-300 hover:border-slate-700'
                  } ${isTargetPulsing ? 'scale-110 ring-2 ring-amber-400 transition-transform' : ''}`}
                >
                  <Folder className={`w-3.5 h-3.5 ${isActive ? 'text-[#068eff]' : 'text-slate-500'}`} />
                  <span>{f.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800/90 text-slate-300 font-mono">
                    {count}
                  </span>
                  {f.notificationsEnabled && (
                    <BellRing className="w-3 h-3 text-emerald-400 animate-pulse shrink-0" />
                  )}
                </button>
              );
            })}

            {/* + Folder button */}
            <button
              type="button"
              onClick={() => setIsCreateFolderOpen(true)}
              className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap bg-[#0b0e14] border border-dashed border-[#068eff]/50 text-[#068eff] hover:bg-[#068eff]/10 active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Папка</span>
            </button>
          </div>
        </div>

        {/* ACTIVE FOLDER BAR (If client folder is selected) */}
        {activeFolder && (
          <div className="px-4 py-2 bg-[#13192a] border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <FolderOpen className="w-4 h-4 text-[#068eff] shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-bold text-white truncate block">
                  {activeFolder.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {displayedLots.length} лотов
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* BUTTON: НАПОМИНАТЬ */}
              <button
                type="button"
                onClick={handleToggleNotifications}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                  activeFolder.notificationsEnabled
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-1 ring-emerald-400/50'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                {activeFolder.notificationsEnabled ? (
                  <>
                    <BellRing className="w-3.5 h-3.5 text-white animate-pulse" />
                    <span>Напоминания активны</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5 text-slate-400" />
                    <span>Напоминать</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleDeleteFolder(activeFolder.id)}
                className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg"
                title="Удалить папку"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Toast inside drawer */}
        {toastNotification && (
          <div className="mx-4 mt-2 px-3 py-1.5 bg-[#172036] border border-[#068eff]/60 rounded-xl text-xs text-white flex items-center gap-2 shadow-lg animate-fade-in-fast shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-[#068eff] shrink-0" />
            <span className="flex-1 truncate">{toastNotification}</span>
          </div>
        )}

        {/* MULTI-SELECT ACTION BAR */}
        {isSelectionMode && selectedLotIds.size > 0 && (
          <div className="px-4 py-2 bg-[#1b2238] border-b border-[#068eff]/40 flex items-center justify-between shrink-0 animate-fade-in-fast">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">
                Отмечено: {selectedLotIds.size}
              </span>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] text-blue-400 underline"
              >
                {selectedLotIds.size === displayedLots.length ? 'Снять все' : 'Все'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsMultiFolderPickerOpen(true)}
              className="px-3 py-1 bg-[#068eff] hover:bg-blue-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-colors"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>В папку</span>
            </button>
          </div>
        )}

        {/* BOOKMARKS LIST */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
          {displayedLots.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Folder className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="font-semibold text-white">Лотов нет</p>
              <p className="text-xs text-slate-500 mt-1">
                Добавьте автомобили из каталога в закладки
              </p>
            </div>
          ) : (
            displayedLots.map((lot) => {
              const isChecked = selectedLotIds.has(lot.id);
              const isFlying = flyingLotIds.has(lot.id);
              const assignedFolder = folders.find((f) => f.lotIds.includes(lot.id));

              return (
                <div
                  key={lot.id}
                  onClick={() => {
                    if (isSelectionMode) {
                      handleToggleSelectCard(lot.id, {} as any);
                    } else {
                      onSelect(lot);
                      onClose();
                    }
                  }}
                  className={`bg-[#141824] hover:bg-[#181d2e] rounded-xl border p-2.5 flex gap-2.5 cursor-pointer transition-all relative ${
                    isChecked
                      ? 'border-[#068eff] bg-[#121a30] shadow-md ring-1 ring-[#068eff]'
                      : 'border-slate-800'
                  } ${isFlying ? 'animate-fly-to-folder' : ''}`}
                >
                  {/* Selection Checkbox */}
                  {isSelectionMode && (
                    <div
                      onClick={(e) => handleToggleSelectCard(lot.id, e)}
                      className="flex items-center justify-center shrink-0 pr-1"
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                          isChecked
                            ? 'bg-[#068eff] border-[#068eff] text-white'
                            : 'border-slate-600 bg-slate-900/80 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                  )}

                  {/* Thumbnail */}
                  <div className="w-20 h-18 rounded-lg overflow-hidden bg-slate-900 shrink-0 relative">
                    <img
                      src={lot.images[0]}
                      alt={lot.model}
                      className="w-full h-full object-cover"
                    />
                    {lot.isTimed && (
                      <span className="absolute bottom-0.5 left-0.5 px-1 py-0.2 rounded text-[8px] bg-amber-500 text-black font-bold uppercase">
                        Timed
                      </span>
                    )}
                  </div>

                  {/* Lot Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      {/* Title + Direct actions */}
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-bold text-white truncate font-['Exo_2',sans-serif]">
                          {lot.year} {lot.make} {lot.model}
                        </h4>

                        {/* Direct quick action buttons on card */}
                        {!isSelectionMode && (
                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {/* 1-TAP QUICK FOLDER ASSIGN BUTTON */}
                            <button
                              type="button"
                              onClick={() => {
                                setQuickAssignLotId(lot.id);
                                setIsMultiFolderPickerOpen(true);
                              }}
                              className={`p-1 rounded-md transition-colors ${
                                assignedFolder
                                  ? 'text-[#068eff] bg-[#068eff]/15 hover:bg-[#068eff]/25'
                                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                              }`}
                              title={assignedFolder ? `Папка: ${assignedFolder.name}` : 'Отправить в папку'}
                            >
                              <FolderPlus className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete / remove */}
                            <button
                              type="button"
                              onClick={(e) => handleRemoveFromCurrentFolder(lot.id, e)}
                              className="p-1 text-slate-500 hover:text-red-400 rounded-md hover:bg-slate-800"
                              title={activeFolder ? 'Убрать из папки' : 'Удалить'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Lot id, auction, condition & countdown */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1">
                        <div className="flex items-center gap-1.5">
                          <span>#{lot.lotId}</span>
                          <span>·</span>
                          <span className="text-slate-300 font-semibold">{lot.auction.toUpperCase()}</span>

                          {/* CONDITION: НА ХОДУ (GREEN) VS НЕ НА ХОДУ (RED) */}
                          <span className="ml-1">
                            {lot.condition === 'run' ? (
                              <span className="text-emerald-400 font-sans font-semibold">На ходу</span>
                            ) : (
                              <span className="text-red-400 font-sans font-bold">Не на ходу</span>
                            )}
                          </span>
                        </div>

                        {lot.isTimed && (
                          <TimedCountdownBadge
                            closeDate={lot.timedCloseDate}
                            variant="compact"
                          />
                        )}
                      </div>
                    </div>

                    {/* Pricing & Client folder badge */}
                    <div className="flex items-baseline justify-between mt-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-mono">
                          {formatPrice(lot.currentBidUsd, currency)}
                        </span>

                        {/* Folder tag when viewing 'All' */}
                        {activeFolderId === 'all' && assignedFolder && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-950/80 border border-blue-800 text-blue-300 font-medium flex items-center gap-0.5">
                            <Folder className="w-2.5 h-2.5" />
                            {assignedFolder.name}
                          </span>
                        )}
                      </div>

                      <span className="text-blue-400 font-bold font-mono">
                        {formatRubDirect(lot.estTurnkeyRub, currency)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER TOTALS */}
        {displayedLots.length > 0 && (
          <div className="p-3.5 border-t border-slate-800 bg-[#0d1018] shrink-0">
            <div className="flex items-center justify-between text-xs px-0.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-slate-400">Ставки:</span>
                <span className="font-bold text-white font-mono">
                  {formatPrice(totalUsd, currency)}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-blue-400 font-medium">Под ключ:</span>
                <span className="font-bold text-blue-400 font-mono text-sm">
                  {formatRubDirect(totalRub, currency)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* FOLDER PICKER SHEET */}
        {isMultiFolderPickerOpen && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md rounded-t-3xl z-30 flex flex-col p-4 animate-fade-in-fast">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-[#068eff]" />
                <h4 className="text-sm font-bold text-white font-['Exo_2',sans-serif] uppercase">
                  Отправить в папку
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMultiFolderPickerOpen(false);
                  setQuickAssignLotId(null);
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Folder List */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-3">
              {folders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleMoveSelectedToFolder(f.id)}
                  className="w-full p-2.5 rounded-xl bg-[#141824] hover:bg-[#1a2034] border border-slate-800 hover:border-[#068eff] flex items-center justify-between text-left transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#068eff]/15 text-[#068eff] flex items-center justify-center font-bold">
                      <Folder className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white group-hover:text-[#068eff] transition-colors block">
                        {f.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {f.lotIds.length} лотов
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
                </button>
              ))}
            </div>

            {/* Quick create inline */}
            <form onSubmit={handleCreateFolder} className="pt-2 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Имя клиента (например, Сергей)"
                className="flex-1 px-3 py-2 bg-[#121622] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#068eff]"
              />
              <button
                type="submit"
                disabled={!newFolderName.trim()}
                className="px-3 py-2 bg-[#068eff] disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                Создать
              </button>
            </form>
          </div>
        )}

        {/* CREATE FOLDER MODAL */}
        {isCreateFolderOpen && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md rounded-t-3xl z-30 flex flex-col justify-center p-6 animate-fade-in-fast">
            <div className="bg-[#111522] border border-slate-800 rounded-2xl p-4 shadow-2xl">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <FolderPlus className="w-4 h-4 text-[#068eff]" />
                  <h4 className="text-sm font-bold text-white font-['Exo_2',sans-serif] uppercase">
                    Новая папка клиента
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateFolderOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateFolder} className="space-y-3">
                <input
                  type="text"
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Имя клиента (например, Сергей)"
                  className="w-full px-3 py-2.5 bg-[#0b0e14] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#068eff]"
                />

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateFolderOpen(false)}
                    className="px-3 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={!newFolderName.trim()}
                    className="px-4 py-2 bg-[#068eff] hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md"
                  >
                    Создать
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
