/**
 * FICHIER: AdminNotificationDropdown.tsx
 *
 * DESCRIPTION:
 * Dropdown pour afficher les notifications admin dans le header.
 */

'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAdminNotifications, type AppNotification } from '@/hooks/useAdminNotifications';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';

export function AdminNotificationDropdown() {
  const { unreadCount, recentNotifications, markAsRead, markAllAsRead } = useAdminNotifications();
  const [open, setOpen] = useState(false);

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: fr,
      });
    } catch {
      return dateString;
    }
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await markAsRead(id);
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Erreur lors du marquage de tout comme lu:', error);
    }
  };

  const getNotificationUrl = (notification: AppNotification) => {
    if (notification.data?.url) {
      // Si c'est une URL relative, la préfixer avec ADMIN_BASE_PATH si nécessaire
      const url = notification.data.url;
      if (url.startsWith('/admin')) {
        return `/${ADMIN_BASE_PATH}${url.replace('/admin', '')}`;
      }
      if (url.startsWith('/')) {
        return url;
      }
      return `/${ADMIN_BASE_PATH}${url}`;
    }
    return `/${ADMIN_BASE_PATH}/notifications`;
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative w-10 h-8 rounded-lg hover:bg-[rgba(0,0,0,0.04)] dark:hover:bg-[rgba(255,255,255,0.04)] transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-[#1e1e20] dark:text-[#ececed]" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium shadow-lg"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 sm:w-96 p-0"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Tout marquer comme lu
            </Button>
          )}
        </div>

        {/* Liste des notifications */}
        <div className="max-h-[400px] overflow-y-auto">
          {recentNotifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Aucune notification</p>
            </div>
          ) : (
            <div className="py-2">
              <AnimatePresence>
                {recentNotifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      href={getNotificationUrl(notification)}
                      onClick={() => {
                        if (!notification.readAt) {
                          markAsRead(notification.id);
                        }
                        setOpen(false);
                      }}
                      className={cn(
                        'block px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-b-0',
                        !notification.readAt && 'bg-muted/30'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium truncate">
                              {notification.title}
                            </h4>
                            {!notification.readAt && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="h-2 w-2 rounded-full bg-primary flex-shrink-0"
                              />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                            {notification.body}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                        {!notification.readAt && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer */}
        {recentNotifications.length > 0 && (
          <>
            <div className="border-t p-2">
              <Link
                href={`/${ADMIN_BASE_PATH}/notifications`}
                className="block w-full text-center text-sm text-primary hover:underline py-1"
                onClick={() => setOpen(false)}
              >
                Voir toutes les notifications
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
