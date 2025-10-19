'use client';

import { motion } from 'framer-motion';
import { Container } from './Container';
import { NavDesktop } from './NavDesktop';
import { NavMobile } from './NavMobile';

export function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="from-background/98 to-background/98 sticky top-0 z-50 w-full border-b border-border/20 bg-gradient-to-r via-background/95 shadow-lg backdrop-blur-md supports-[backdrop-filter]:bg-background/80"
    >
      <Container>
        <div className="flex h-20 items-center">
          <NavDesktop />
          <NavMobile />
        </div>
      </Container>
    </motion.header>
  );
}
