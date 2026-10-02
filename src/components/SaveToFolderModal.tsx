import React, { useState } from 'react';
import {
  X,
  Folder,
  FolderPlus,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  Car,
  FolderOpen
} from 'lucide-react';
import { CarLot, ClientFolder, Currency } from '../types/car';
import { formatPrice, formatRubDirect } from '../utils/currency';

import { CAR_PLACEHOLDER_SVG } from '../services/carsApiService';

interface SaveToFolderModalProps {
  isOpen: boolean;
  lot: CarLot | null;
  folders: ClientFolder[];
  currency: Currency;
  onClose: () => void;
  onAssignFolder: (lotId: string, folderId: string | 'unassigned') => void;
  onCreateFolderAndAssign: (folderName: string, lotId: string) => void;
  onRemoveFromBookmarks: (lotId: string) => void;
  onOpenBookmarks: () => void;
}

export const SaveToFolderModal: React.FC<SaveToFolderModalProps> = ({
  isOpen,
  lot,
  folders,
  currency,
  onClose,
  onAssignFolder,
  onCreateFolderAndAssign,
  onRemoveFromBookmarks,
  onOpenBookmarks
}) => {
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [justAssignedFolderId, setJustAssignedFolderId] = useState<string | null>(null);

  if (!isOpen || !lot) return null;

  // Determine which folder currently holds this lot (if any)
  const currentFolder = folders.find((f) => f.lotIds.includes(lot.id));
  const isUnassigned = !currentFolder;

  const handleSelectFolder = (folderId: string | 'unassigned') => {
    setJustAssignedFolderId(folderId);
    onAssignFolder(lot.id, folderId);
    setTimeout(() => {
      setJustAssignedFolderId(null);
    }, 1200);
  };

  const handleCreateNewFolder = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) return;

    onCreateFolderAndAssign(trimmed, lot.id);
    setNewFolderName('');
    setIsCreatingNew(false);
  };

  const handleRemove = () => {
    onRemoveFromBookmarks(lot.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex flex-col justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-fade-in-fast"
      />

      {/* Slide-up Bottom Sheet */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto bg-[#0f131c] border-t border-slate-800 rounded-t-3xl shadow-2xl p-5 z-10 animate-slide-up-fast text-slate-100"
      >
        {/* Drag Handle */}
        <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto mb-3.5 shrink-0" />

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-800/80 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  Сохранено
                </span>
                <span className="text-[11px] text-slate-400">Выберите папку</span>
              </div>
              <h3 className="text-base font-bold text-white font-['Exo_2',sans-serif] tracking-wide mt-0.5">
                В какую папку отправить?
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Car Preview Card */}
        <div className="p-3 bg-[#141824] border border-slate-800/80 rounded-2xl mb-4 flex items-center gap-3">
          <div className="w-16 h-14 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0 relative">
            <img
              src={lot.images[0] || CAR_PLACEHOLDER_SVG}
              alt={`${lot.make} ${lot.model}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = CAR_PLACEHOLDER_SVG;
              }}
            />
            <span
              className={`absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded text-[8px] font-bold uppercase ${
                lot.auction === 'iaai' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
              }`}
            >
              {lot.auction}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-white truncate font-['Exo_2',sans-serif]">
              {lot.year} {lot.make} {lot.model} {lot.trim}
            </h4>
            <div className="flex items-center gap-2 mt-1 text-[11px]">
              <span className="text-slate-400">Лот #{lot.lotId}</span>
              <span className="text-slate-600">•</span>
              <span className="font-semibold text-emerald-400">
                {currency === 'USD'
                  ? formatPrice(lot.currentBidUsd, 'USD')
                  : formatRubDirect(lot.estTurnkeyRub, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Existing Folders Selection */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-0.5">
            <span>Существующие папки:</span>
            <span className="text-[11px] text-slate-500">{folders.length} шт.</span>
          </div>

          {/* Folder: Общие закладки (без папки клиента) */}
          <button
            type="button"
            onClick={() => handleSelectFolder('unassigned')}
            className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
              isUnassigned
                ? 'bg-blue-600/15 border-[#068eff] text-white shadow-md shadow-[#068eff]/10'
                : 'bg-[#121622] border-slate-800/80 text-slate-300 hover:bg-[#161c2c]'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isUnassigned
                    ? 'bg-[#068eff] text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Folder className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold block truncate">
                  📁 Все закладки (без папки клиента)
                </span>
                <span className="text-[10px] text-slate-400">
                  Общий список избранного
                </span>
              </div>
            </div>

            <div className="shrink-0 ml-2">
              {isUnassigned ? (
                <div className="w-6 h-6 rounded-full bg-[#068eff] text-white flex items-center justify-center shadow">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border border-slate-700 bg-slate-900/50" />
              )}
            </div>
          </button>

          {/* Folders List */}
          {folders.map((f) => {
            const isSelected = currentFolder?.id === f.id;
            const isJustAssigned = justAssignedFolderId === f.id;

            return (
              <button
                key={f.id}
                type="button"
                onClick={() => handleSelectFolder(f.id)}
                className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-emerald-600/15 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                    : 'bg-[#121622] border-slate-800/80 text-slate-300 hover:bg-[#161c2c]'
                } ${isJustAssigned ? 'scale-[1.01] ring-2 ring-emerald-400/50' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Folder className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">
                        Папка: {f.name}
                      </span>
                      {isSelected && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                          Текущая
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {f.lotIds.length} {f.lotIds.length === 1 ? 'машина' : 'машин'}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 ml-2">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-slate-700 bg-slate-900/50" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Section: Create New Folder */}
        <div className="mb-4">
          {!isCreatingNew ? (
            <button
              type="button"
              onClick={() => setIsCreatingNew(true)}
              className="w-full py-2.5 px-3 rounded-2xl border border-dashed border-slate-700 hover:border-emerald-500/70 text-slate-300 hover:text-emerald-400 bg-[#111624] text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Создать новую папку для этого лота</span>
            </button>
          ) : (
            <form
              onSubmit={handleCreateNewFolder}
              className="p-3 bg-[#131726] border border-emerald-500/40 rounded-2xl space-y-2.5 animate-fade-in-fast"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Новая папка клиента:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Отмена
                </button>
              </div>

              <input
                type="text"
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Например: Клиент Максим, BMW для себя..."
                className="w-full px-3 py-2 bg-[#0c0f17] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />

              <button
                type="submit"
                disabled={!newFolderName.trim()}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-40 text-white font-['Exo_2',sans-serif] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Создать и отправить лот сюда</span>
              </button>
            </form>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-[#068eff] hover:bg-[#007be5] active:bg-[#006cc8] text-white font-['Exo_2',sans-serif] font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-md shadow-[#068eff]/20 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Готово</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenBookmarks();
            }}
            className="px-3 py-3 bg-[#161c2a] hover:bg-[#1d2538] border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Открыть все закладки"
          >
            <ExternalLink className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Закладки</span>
          </button>

          <button
            type="button"
            onClick={handleRemove}
            className="p-3 bg-red-950/40 hover:bg-red-900/60 border border-red-900/60 text-red-400 hover:text-red-300 rounded-xl transition-colors"
            title="Убрать из закладок"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
