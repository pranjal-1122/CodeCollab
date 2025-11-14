// src/pages/LandingPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import Orb from '../components/common/Orb';

const LandingPage = () => {
  const { currentUser, loading } = useAuth();
  const ctaLink = currentUser ? '/dashboard' : '/auth';
  const ctaText = "Get Started";

  // Animation variants (no change)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  // HeaderLink component (no change)
  const HeaderLink = ({ children, href = "#" }) => (
    <a href={href} className="text-gray-400 hover:text-white transition-colors">
      {children}
    </a>
  );

  return (
    // 1. The root is a simple flex column with a black background.
    //    NO PADDING (pt-24) is applied here.
    <div className="flex flex-col min-h-screen bg-black text-white">

      {/* 2. The Header is now a centered, auto-width pill */}
    <div className="fixed top-0 left-0 right-0 z-20 p-12 flex justify-center">
      <motion.header 
        className="flex justify-between items-center z-20 min-w-[500px]
                   p-4 px-6 bg-gray-900/40 backdrop-blur rounded-full border border-white/10"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="flex items-center gap-2">
          {/* Gradient Logo */}
          <span className="font-bold text-xl bg-gradient-to-r from-purple-500 to-blue-400 bg-clip-text text-transparent">
            CODECOLLAB
          </span>
        </div>
        <nav className="flex items-center gap-6 text-sm">
          {/* "Home" and "Dashboard" buttons are removed */}
          <HeaderLink>Features</HeaderLink>
          <HeaderLink>Docs</HeaderLink>
        </nav>
      </motion.header>
    </div>

      {/* 3. The Main Content fills the page AND centers its children. */}
      {/* It has NO PADDING, so the content is centered in the
           *viewport* and will slide under the fixed header. */}
      <main className="flex-1 flex items-center justify-center p-6 relative">

        {/* This is the content block being centered. */}
        <motion.div
          className="relative w-full max-w-6xl h-[700px]"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >

          {/* LAYER 1: The Orb (z-0) */}
          <div className="absolute inset-0 z-0">
            <Orb
              hue={0}
              hoverIntensity={4.5}
            />
          </div>

          {/* LAYER 2: The Text (z-10, pointer-events-none) */}
          {/* This ensures the mouse hovers the ORB, not the text block. */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center pointer-events-none">

            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-7xl font-bold mb-8 max-w-3xl"
            >
              Become emboldened by the flame of ambition
            </motion.h1>

            <motion.div
              variants={itemVariants}
              className="flex gap-4"
            >
              {/* Buttons are set to 'pointer-events-auto' so they are clickable. */}
              <Link
                to={ctaLink}
                className="pointer-events-auto px-8 py-3 bg-white text-black text-md font-semibold rounded-full shadow-md transition-all hover:bg-gray-200 hover:scale-105"
              >
                {loading ? 'Loading...' : ctaText}
              </Link>
              <button
                className="pointer-events-auto px-8 py-3 bg-gray-800 text-gray-300 text-md font-semibold rounded-full shadow-md transition-all hover:bg-gray-700 hover:scale-105"
              >
                Learn More
              </button>
            </motion.div>
          </div>

        </motion.div>
      </main>
    </div>
  );
};

export default LandingPage;