import React, { useState, useEffect, useRef, useMemo, useCallback, Fragment, forwardRef, createContext, useContext } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // import framer-motion library for animation 

// Utility function (cn equivalent)
function cn(...inputs) {
      return inputs.filter(Boolean).join(' ');
}

// function to resolve asset paths 
function resolveAssetPath(path) {
  // if the path is already absolute, return it as it is 
  if (path.startsWith('/')) {
    return path;
  }
  // if it is a relative path, prepend the base path
  return `/shota-portfolio/${path}`;
}

// create a context to manage audio state 
const AudioContext = createContext(null);

// Audio Provider Component
function AudioProvider({ children }) {
  const backgroundMusicRef = useRef(null);
  const buttonSoundRef = useRef(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  useEffect(() => {
    // Initialize audio elements
    const bgMusic = new Audio(resolveAssetPath('assets/background-music.mp3'));
    bgMusic.loop = true;
    bgMusic.volume = 0.3; // 30% volume
    backgroundMusicRef.current = bgMusic;

    const btnSound = new Audio(resolveAssetPath('assets/button-click.mp3'));
    btnSound.volume = 0.5; // 50% volume
    buttonSoundRef.current = btnSound;

    // Function to start background music after user interaction
    const startMusic = async () => {
      if (!hasUserInteracted && bgMusic) {
        try {
          await bgMusic.play();
          setIsMusicPlaying(true);
          setHasUserInteracted(true);
        } catch (err) {
          console.log('Background music play failed:', err);
        }
      }
    };

    // Listen for user interaction to start music
    const handleUserInteraction = () => {
      startMusic();
    };

    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });

    return () => {
      if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
      }
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []); // Empty dependency array - only run once on mount

  // Function to play button click sound
  const playButtonSound = useCallback(() => {
    if (buttonSoundRef.current) {
      buttonSoundRef.current.currentTime = 0; // Reset to start
      buttonSoundRef.current.play().catch(err => {
        console.log('Button sound play failed:', err);
      });
    }
  }, []);

  const value = {
    playButtonSound,
    isMusicPlaying,
    backgroundMusicRef
  };

  return React.createElement(AudioContext.Provider, { value }, children);
}

// Hook to use audio context
function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
}


// Simple Button component
function Button({ children, className = '', variant = 'default', size = 'default', onClick, asChild, ...props }) {
  const baseClasses = 'btn';
  const variantClasses = {
        cosmos: 'btn-cosmos',
        cosmosOutline: 'btn-cosmos-outline',
      };
  const sizeClasses = {
        lg: 'btn-lg',
        xl: 'btn-xl',
      };
      
  const classes = cn(
        baseClasses,
        variantClasses[variant] || '',
        sizeClasses[size] || '',
        className
      );
      
      if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, { className: classes, ...props });
      }
      
      return React.createElement('button', { className: classes, onClick, ...props }, children);
}

// StarField Component
function StarField({ starCount = 400, className = '', parallaxOffset = 0 }) {
  const containerRef = useRef(null);
      const [shootingStars, setShootingStars] = useState([]);

  // use useMemo() to store computed positions of stars 
  const starLayers = useMemo(() => {
    // group stars into 3 different layers 
    const layers = [
          { count: Math.floor(starCount * 0.5), speed: 0.1, sizeRange: [0.5, 1.5] },
          { count: Math.floor(starCount * 0.3), speed: 0.3, sizeRange: [1, 2.5] },
          { count: Math.floor(starCount * 0.2), speed: 0.5, sizeRange: [2, 3.5] },
        ];

        return layers.map((layer) => {
      const stars = [];
          // compute different positions, size and twinkle variables of each star
          for (let i = 0; i < layer.count; i++) {
            stars.push({
              x: Math.random() * 100,
              y: Math.random() * 100,
              size: Math.random() * (layer.sizeRange[1] - layer.sizeRange[0]) + layer.sizeRange[0],
              opacity: Math.random() * 0.5 + 0.3,
              twinkleSpeed: Math.random() * 3 + 2,
              twinkleDelay: Math.random() * 5,
            });
          }
          return { stars, speed: layer.speed };
        });
      }, [starCount]);

      // spawn shooting stars at random positions 
      useEffect(() => {
    const spawnShootingStar = () => {
      const newStar = {
            id: Date.now() + Math.random(),
            startX: Math.random() * 80 + 10,
            startY: Math.random() * 40,
            angle: Math.random() * 30 + 15,
            duration: Math.random() * 1 + 0.8,
          };
          
          setShootingStars(prev => [...prev, newStar]);
          
          setTimeout(() => {
            setShootingStars(prev => prev.filter(s => s.id !== newStar.id));
          }, newStar.duration * 1000 + 100);
        };

    const interval = setInterval(() => {
          spawnShootingStar();
        }, 3000);

    const initialTimeout = setTimeout(spawnShootingStar, 1000);

        return () => {
          clearInterval(interval);
          clearTimeout(initialTimeout);
        };
      }, []);

      return React.createElement('div', {
        ref: containerRef,
        className: `fixed inset-0 overflow-hidden pointer-events-none ${className}`,
        style: {
          background: 'linear-gradient(180deg, hsl(230 40% 4%) 0%, hsl(260 50% 10%) 40%, hsl(220 60% 12%) 70%, hsl(230 40% 6%) 100%)',
        }
      }, [
        React.createElement('div', { key: 'nebula-container', className: 'absolute inset-0 overflow-hidden' }, [
          React.createElement('div', {
            key: 'nebula-slow',
            className: 'absolute w-[150%] h-[150%] -top-1/4 -left-1/4 animate-nebula-drift-slow opacity-20',
            style: {
              background: 'radial-gradient(ellipse 60% 40% at 30% 40%, hsl(280 70% 30% / 0.6) 0%, transparent 50%), radial-gradient(ellipse 50% 35% at 70% 60%, hsl(200 80% 35% / 0.5) 0%, transparent 50%)',
            }
          }),
          React.createElement('div', {
            key: 'nebula-medium',
            className: 'absolute w-[130%] h-[130%] -top-[15%] -left-[15%] animate-nebula-drift-medium opacity-25',
            style: {
              background: 'radial-gradient(ellipse 45% 50% at 60% 30%, hsl(260 60% 40% / 0.4) 0%, transparent 45%), radial-gradient(ellipse 40% 30% at 25% 70%, hsl(180 70% 30% / 0.4) 0%, transparent 40%)',
            }
          }),
          React.createElement('div', {
            key: 'nebula-fast',
            className: 'absolute w-[120%] h-[120%] -top-[10%] -left-[10%] animate-nebula-drift-fast opacity-15',
            style: {
              background: 'radial-gradient(ellipse 30% 25% at 80% 20%, hsl(300 50% 45% / 0.5) 0%, transparent 40%), radial-gradient(ellipse 35% 20% at 15% 80%, hsl(220 60% 40% / 0.4) 0%, transparent 35%)',
            }
          }),
        ]),
        React.createElement('div', {
          key: 'nebula-base',
          className: 'absolute inset-0 opacity-30',
          style: {
            background: 'radial-gradient(ellipse 80% 50% at 20% 40%, hsl(280 60% 25% / 0.4) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 80% 60%, hsl(200 70% 30% / 0.3) 0%, transparent 50%)',
          }
        }),
        ...starLayers.map((layer, layerIndex) =>
          React.createElement('div', {
            key: `layer-${layerIndex}`,
            className: 'absolute inset-0',
            style: {
              transform: `translateX(${-parallaxOffset * layer.speed}px)`,
              willChange: 'transform',
            }
          }, layer.stars.map((star, index) => // create a tiny glowing stars 
            React.createElement('div', {
              key: `star-${layerIndex}-${index}`,
              className: 'absolute rounded-full animate-twinkle', // make it circle
              style: {
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                backgroundColor: star.size > 2 ? 'hsl(200 90% 85%)' : 'hsl(210 40% 98%)',
                boxShadow: star.size > 2 
                  ? `0 0 ${star.size * 3}px hsl(200 90% 70% / 0.6)` 
                  : `0 0 ${star.size * 2}px hsl(210 40% 98% / 0.4)`,
                animationDelay: `${star.twinkleDelay}s`,
                animationDuration: `${star.twinkleSpeed}s`,
              }
            })
          ))
        ),
        ...shootingStars.map((star) =>
          React.createElement('div', {
            key: star.id,
            className: 'absolute pointer-events-none',
            style: {
              left: `${star.startX}%`,
              top: `${star.startY}%`,
              transform: `rotate(${star.angle}deg)`,
            }
          }, React.createElement('div', {
            className: 'relative animate-shooting-star',
            style: {
              animationDuration: `${star.duration}s`,
            }
          }, [
            React.createElement('div', {
              key: 'star-core',
              className: 'absolute w-2 h-2 rounded-full',
              style: {
                background: 'hsl(200 90% 90%)',
                boxShadow: '0 0 10px hsl(200 90% 80%), 0 0 20px hsl(200 90% 70%)',
              }
            }), // creates a long tail of the shooting stars 
            React.createElement('div', {
              key: 'star-tail',
              className: 'absolute top-0.5 -left-24 w-24 h-1 rounded-full', // h = 1 to make it super thin 
              style: {
                background: 'linear-gradient(90deg, transparent, hsl(200 80% 80% / 0.8))',
              }
            }),
          ]))
        ),
      ]);
}

// Constellation Component
function Constellation({ name, image, position, onClick }) {
      return React.createElement(motion.div, {
        className: 'absolute cursor-pointer group',
        style: {
          left: `${position.x}px`,
          top: `${position.y}px`,
        },
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.6, ease: 'easeOut' },
        whileHover: { scale: 1.05 },
        onClick: onClick,
      }, [
        React.createElement('div', {
          key: 'glow',
          className: 'absolute inset-0 blur-2xl bg-accent/20 rounded-full scale-75 group-hover:scale-100 group-hover:bg-accent/30 transition-all duration-500'
        }),
        React.createElement(motion.img, {
          key: 'image',
          src: resolveAssetPath(image),
          alt: name,
          className: 'relative w-48 h-48 md:w-64 md:h-64 object-contain constellation-glow transition-all duration-300 group-hover:brightness-125',
          draggable: false,
          animate: { y: [0, -8, 0] },
          transition: {
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }
        }),
        React.createElement(motion.div, {
          key: 'label',
          className: 'absolute -bottom-8 left-1/2 -translate-x-1/2 text-center',
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { delay: 0.3 }
        }, React.createElement('span', {
          className: 'font-display text-sm md:text-base text-foreground/80 tracking-widest uppercase group-hover:text-primary transition-colors duration-300'
        }, name)),
        React.createElement('div', {
          key: 'indicator',
          className: 'absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300'
        }, React.createElement('div', {
          className: 'bg-primary/20 backdrop-blur-sm rounded-full px-4 py-2 border border-primary/40'
        }, React.createElement('span', {
          className: 'text-primary text-xs font-display tracking-wider'
        }, 'Click to view')))
      ]);
}

// ConstellationModal Component
function ConstellationModal({ project, isOpen, onClose }) {
      const { playButtonSound } = useAudio();
      if (!project) return null;

      if (!isOpen) return null;

      return React.createElement(AnimatePresence, null,
        React.createElement(motion.div, {
          key: 'backdrop',
          className: 'fixed inset-0 bg-background/80 backdrop-blur-sm z-50',
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          onClick: () => {
            playButtonSound();
            onClose();
          }
        }),
        React.createElement(motion.div, {
          key: 'modal',
          className: 'fixed inset-4 md:inset-10 lg:inset-20 z-50 flex items-center justify-center',
          initial: { opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.9 },
          transition: { type: 'spring', duration: 0.5 }
        }, React.createElement('div', {
          className: 'relative w-full h-full max-w-6xl mx-auto bg-card/95 backdrop-blur-md rounded-2xl border border-border/50 overflow-hidden shadow-2xl'
        }, [
          React.createElement('button', {
            key: 'close',
            onClick: () => {
              playButtonSound();
              onClose();
            },
            className: 'absolute top-4 right-4 z-10 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors'
          }, React.createElement('svg', {
            className: 'w-6 h-6 text-foreground',
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24'
          }, React.createElement('path', {
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeWidth: 2,
            d: 'M6 18L18 6M6 6l12 12'
          }))),
          React.createElement('div', {
            key: 'content',
            className: 'flex flex-col md:flex-row h-full'
          }, [
            React.createElement('div', {
              key: 'left',
              className: 'flex-1 p-6 md:p-10 flex flex-col justify-center'
            }, React.createElement(motion.div, {
              initial: { opacity: 0, x: -20 },
              animate: { opacity: 1, x: 0 },
              transition: { delay: 0.2 }
            }, [
              React.createElement('span', {
                key: 'label',
                className: 'text-accent text-sm font-display tracking-widest uppercase'
              }, `${project.name} Constellation`),
              React.createElement('h2', {
                key: 'title',
                className: 'font-display text-3xl md:text-4xl lg:text-5xl mt-2 mb-4 text-foreground'
              }, project.title),
              React.createElement('p', {
                key: 'description',
                className: 'text-muted-foreground text-base md:text-lg leading-relaxed mb-6'
              }, project.description),
              React.createElement('div', {
                key: 'tech',
                className: 'flex flex-wrap gap-2 mb-8'
              }, project.technologies.map((tech) =>
                React.createElement('span', {
                  key: tech,
                  className: 'px-3 py-1 text-sm bg-muted rounded-full text-muted-foreground border border-border/50'
                }, tech)
              )),
              React.createElement(Button, {
                key: 'link',
                variant: 'cosmos',
                size: 'lg',
                asChild: true
              }, React.createElement('a', {
                href: project.link,
                target: '_blank',
                rel: 'noopener noreferrer'
              }, [
                'View Project',
                React.createElement('svg', {
                  key: 'icon',
                  className: 'w-4 h-4 ml-2',
                  fill: 'none',
                  stroke: 'currentColor',
                  viewBox: '0 0 24 24'
                }, React.createElement('path', {
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                  strokeWidth: 2,
                  d: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
                }))
              ]))
            ])),
            React.createElement(motion.div, {
              key: 'right',
              className: 'flex-1 relative bg-muted/30',
              initial: { opacity: 0, x: 20 },
              animate: { opacity: 1, x: 0 },
              transition: { delay: 0.3 }
            }, [
              React.createElement('img', {
                key: 'img',
                src: resolveAssetPath(project.image),
                alt: project.title,
                className: 'w-full h-full object-cover'
              }),
              React.createElement('div', {
                key: 'gradient',
                className: 'absolute inset-0 bg-gradient-to-l from-transparent to-card/50'
              })
            ])
          ]),
          React.createElement('div', {
            key: 'back-mobile',
            className: 'absolute bottom-6 left-1/2 -translate-x-1/2 md:hidden'
          },           React.createElement(Button, {
            variant: 'cosmosOutline',
            onClick: () => {
              playButtonSound();
              onClose();
            }
          }, 'Back to Universe'))
        ]))
      )
}

// MenuOverlay Component
function MenuOverlay({ isOpen, onClose }) {
  const { playButtonSound } = useAudio();
  const navigate = useNavigate();
  const menuItems = [
        { label: 'Home', path: '/', icon: 'Home' },
        { label: 'Who', path: '/who', icon: 'User' },
      ];

  const IconComponent = ({ name, className }) => {
    const icons = {
          Home: React.createElement('svg', { className, fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
            React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' })
          ),
          User: React.createElement('svg', { className, fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
            React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' })
          ),
          X: React.createElement('svg', { className, fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
            React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M6 18L18 6M6 6l12 12' })
          ),
        };
        return icons[name] || null;
      };

      return React.createElement(AnimatePresence, {}, isOpen && [
        React.createElement(motion.div, {
          key: 'backdrop',
          className: 'fixed inset-0 bg-background/90 backdrop-blur-md z-50',
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          onClick: onClose
        }),
        React.createElement(motion.div, {
          key: 'menu',
          className: 'fixed inset-0 z-50 flex items-center justify-center',
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        }, [
          React.createElement('button', {
            key: 'close',
            onClick: () => {
              playButtonSound();
              onClose();
            },
            className: 'absolute top-6 right-6 p-3 rounded-full border-2 border-foreground/50 hover:border-foreground hover:bg-foreground/10 transition-all'
          }, React.createElement(IconComponent, { name: 'X', className: 'w-6 h-6 text-foreground' })),
          React.createElement('nav', {
            key: 'nav',
            className: 'flex flex-col items-center gap-8'
          }, menuItems.map((item, index) =>
            React.createElement(motion.div, {
              key: item.path,
              initial: { opacity: 0, y: 30 },
              animate: { opacity: 1, y: 0 },
              exit: { opacity: 0, y: 30 },
              transition: { delay: index * 0.1 }
            }, React.createElement(Link, {
              to: item.path,
              onClick: () => {
                playButtonSound();
                onClose();
              },
              className: 'group flex items-center gap-4 text-4xl md:text-6xl font-display tracking-widest text-foreground/70 hover:text-primary transition-colors duration-300'
            }, [
              React.createElement(IconComponent, {
                key: 'icon',
                name: item.icon,
                className: 'w-8 h-8 md:w-12 md:h-12 opacity-50 group-hover:opacity-100 transition-opacity'
              }),
              item.label
            ]))
          ))
        ])
      ]);
}

// Index Page
function Index() {
  const navigate = useNavigate();
  const { playButtonSound } = useAudio();

      return React.createElement('div', { className: 'relative min-h-screen overflow-hidden' }, [
        React.createElement(StarField, { key: 'stars', starCount: 250 }),
        React.createElement('div', {
          key: 'content',
          className: 'relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center'
        }, [
          React.createElement(motion.div, {
            key: 'title',
            initial: { opacity: 0, y: 30 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.8, ease: 'easeOut' }
          }, React.createElement('h1', {
            className: 'font-display text-4xl md:text-6xl lg:text-7xl tracking-wider mb-4'
          }, [
            React.createElement('span', { key: 'my', className: 'text-foreground' }, 'SHOTA\'S'),
            React.createElement('br', { key: 'br' }),
            React.createElement('span', { key: 'universe', className: 'text-gradient-gold' }, 'UNIVERSE')
          ])),
          React.createElement(motion.div, {
            key: 'description',
            className: 'max-w-2xl mx-auto mt-6 mb-10',
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.8, delay: 0.3, ease: 'easeOut' }
          }, React.createElement('p', {
            className: 'text-muted-foreground text-lg md:text-xl leading-relaxed'
          }, 'Welcome to Shota\'s universe! Each constellation represents my personal or group projects, so explore them as you wish. Click and drag or swipe horizontally to explore my universe, and learn about each project and me as a pseron!')),
          React.createElement(motion.div, {
            key: 'button',
            initial: { opacity: 0, scale: 0.9 },
            animate: { opacity: 1, scale: 1 },
            transition: { duration: 0.6, delay: 0.6, ease: 'easeOut' }
          }, React.createElement(Button, {
            variant: 'cosmos',
            size: 'xl',
            onClick: () => {
              playButtonSound();
              navigate('/universe');
            },
            className: 'relative overflow-hidden group'
          }, [
            React.createElement('span', { key: 'text', className: 'relative z-10' }, 'Start Exploring My Universe'),
            React.createElement(motion.div, {
              key: 'hover',
              className: 'absolute inset-0 bg-primary/20',
              initial: { x: '-100%' },
              whileHover: { x: 0 },
              transition: { duration: 0.3 }
            })
          ]))
        ])
      ]);
}

// Who Page
function Who() {
  const navigate = useNavigate();
  const { playButtonSound } = useAudio();

  const skills = [
        { category: 'Frontend', items: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Framer Motion', 'React Native', 'Expo', 'React Native Web'] },
        { category: 'Backend', items: ['Node.js', 'Python', 'PostgreSQL', 'MongoDB', 'GraphQL'] },
        { category: 'Design', items: ['Figma', 'Adobe XD', 'UI/UX', 'Prototyping', 'Design Systems'] },
        { category: 'Tools', items: ['Git', 'Docker', 'AWS', 'Vercel', 'CI/CD'] },
      ];

  const socialLinks = [
        { name: 'Email', icon: 'Mail', href: 'mailto:sm11745@nyu.edu' },
        { name: 'GitHub', icon: 'Github', href: 'https://github.com/KimShota' },
        { name: 'LinkedIn', icon: 'Linkedin', href: 'https://www.linkedin.com/in/shota-matsumoto-12405a22a/' },
        { name: 'Instagram', icon: 'Instagram', href: 'https://www.instagram.com/shotacademic/' },
      ];

  const IconComponent = ({ name, className }) => {
    const icons = {
          ArrowLeft: React.createElement('svg', { className, fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
            React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M10 19l-7-7m0 0l7-7m-7 7h18' })
          ),
          Mail: React.createElement('svg', { className, fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
            React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' })
          ),
          Github: React.createElement('svg', { className, fill: 'currentColor', viewBox: '0 0 24 24' },
            React.createElement('path', { d: 'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' })
          ),
          Linkedin: React.createElement('svg', { className, fill: 'currentColor', viewBox: '0 0 24 24' },
            React.createElement('path', { d: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' })
          ),
          Instagram: React.createElement('svg', { className, fill: 'currentColor', viewBox: '0 0 24 24' },
            React.createElement('path', { d: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' })
          ),
        };
        return icons[name] || null;
      };

      return React.createElement('div', { className: 'relative min-h-screen overflow-hidden' }, [
        React.createElement(StarField, { key: 'stars', starCount: 150 }),
        React.createElement(motion.button, {
          key: 'back',
          className: 'fixed top-6 left-6 z-40 p-3 rounded-full border-2 border-foreground/50 hover:border-foreground hover:bg-foreground/10 transition-all',
          onClick: () => navigate('/universe'),
          initial: { opacity: 0, x: -20 },
          animate: { opacity: 1, x: 0 },
          transition: { delay: 0.2 }
        }, React.createElement(IconComponent, { name: 'ArrowLeft', className: 'w-6 h-6 text-foreground' })),
        React.createElement('div', {
          key: 'content',
          className: 'relative z-10 min-h-screen'
        }, [
          React.createElement('section', {
            key: 'hero',
            className: 'min-h-screen flex flex-col lg:flex-row items-center justify-center px-6 py-20 lg:py-10 gap-10 lg:gap-20 max-w-7xl mx-auto'
          }, [
            React.createElement(motion.div, {
              key: 'photo',
              className: 'flex-shrink-0',
              initial: { opacity: 0, x: -50 },
              animate: { opacity: 1, x: 0 },
              transition: { duration: 0.6 }
            }, React.createElement('div', { className: 'relative' }, [
              React.createElement('div', {
                className: 'w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-primary/30 glow-gold'
              }, React.createElement('img', {
                src: resolveAssetPath('assets/profile-photo.png'),
                alt: 'Profile Photo',
                className: 'w-full h-full object-cover'
              })),
              React.createElement('div', {
                className: 'absolute inset-0 rounded-full border border-primary/20 scale-110 animate-pulse-glow'
              })
            ])),
            React.createElement(motion.div, {
              key: 'intro',
              className: 'max-w-2xl text-center lg:text-left',
              initial: { opacity: 0, x: 50 },
              animate: { opacity: 1, x: 0 },
              transition: { duration: 0.6, delay: 0.2 }
            }, [
              React.createElement('h1', {
                key: 'title',
                className: 'font-display text-4xl md:text-5xl lg:text-6xl tracking-wide mb-4'
              }, [
                React.createElement('span', { key: 'hello', className: 'text-foreground' }, "Hey, I'm"),
                React.createElement('br', { key: 'br' }),
                React.createElement('span', { key: 'name', className: 'text-gradient-gold' }, 'Shota Matsumoto')
              ]),
              React.createElement('p', {
                key: 'desc1',
                className: 'text-muted-foreground text-lg md:text-xl leading-relaxed mb-6'
              }, 'A very passionate web & mobile developer who loves creating to make impacts in the world. Supporting 200K students around the world on multiple social media platforms, I founded an Instagram-style mobile learning app, Brainlot, to innovate the way students learn. I also love creating VR simulations to comprehend and control human emotions as I did in the past internship and research experience.'),
              React.createElement('p', {
                key: 'desc2',
                className: 'text-muted-foreground text-base leading-relaxed'
              }, "Having full-stack and data-analytics experience for 4 years, I now focus on building scalable, intelligent systems that combine AI, XR, and human-centered design to solve real-world problems.")
            ])
          ]),
          React.createElement('section', {
            key: 'skills-contact',
            className: 'min-h-screen flex flex-col lg:flex-row items-start justify-center px-6 py-20 gap-10 lg:gap-20 max-w-7xl mx-auto'
          }, [
            React.createElement(motion.div, {
              key: 'skills',
              className: 'flex-1 w-full',
              initial: { opacity: 0, y: 30 },
              whileInView: { opacity: 1, y: 0 },
              viewport: { once: true },
              transition: { duration: 0.6 }
            }, [
              React.createElement('h2', {
                key: 'title',
                className: 'font-display text-2xl md:text-3xl text-foreground mb-8 tracking-wide'
              }, [
                'Skills & ',
                React.createElement('span', { key: 'span', className: 'text-primary' }, 'Expertise')
              ]),
              React.createElement('div', {
                key: 'grid',
                className: 'grid grid-cols-1 md:grid-cols-2 gap-6'
              }, skills.map((skillGroup, index) =>
                React.createElement(motion.div, {
                  key: skillGroup.category,
                  className: 'bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50',
                  initial: { opacity: 0, y: 20 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true },
                  transition: { delay: index * 0.1 }
                }, [
                  React.createElement('h3', {
                    key: 'cat',
                    className: 'font-display text-lg text-accent mb-4 tracking-wider'
                  }, skillGroup.category),
                  React.createElement('div', {
                    key: 'items',
                    className: 'flex flex-wrap gap-2'
                  }, skillGroup.items.map((skill) =>
                    React.createElement('span', {
                      key: skill,
                      className: 'px-3 py-1 text-sm bg-muted/50 rounded-full text-foreground/80 border border-border/30'
                    }, skill)
                  ))
                ])
              ))
            ]),
            React.createElement(motion.div, {
              key: 'contact',
              className: 'flex-1 w-full lg:max-w-md',
              initial: { opacity: 0, y: 30 },
              whileInView: { opacity: 1, y: 0 },
              viewport: { once: true },
              transition: { duration: 0.6, delay: 0.2 }
            }, [
              React.createElement('h2', {
                key: 'title',
                className: 'font-display text-2xl md:text-3xl text-foreground mb-8 tracking-wide'
              }, [
                'Get in ',
                React.createElement('span', { key: 'span', className: 'text-primary' }, 'Touch')
              ]),
              React.createElement('div', {
                key: 'card',
                className: 'bg-card/50 backdrop-blur-sm rounded-xl p-8 border border-border/50'
              }, [
                React.createElement('p', {
                  key: 'desc',
                  className: 'text-muted-foreground mb-8 leading-relaxed'
                }, "I’m always open to discuss new ideas, projects, research and potential collaborations, so feel free to reach out to me. I can’t wait to connect with you."),
                React.createElement('div', {
                  key: 'social',
                  className: 'flex flex-wrap gap-4 mb-8'
                }, socialLinks.map((link) =>
                  React.createElement('a', {
                    key: link.name,
                    href: link.href,
                    className: 'p-3 rounded-full bg-muted/50 hover:bg-primary/20 hover:border-primary border border-border/50 transition-all group',
                    title: link.name
                  }, React.createElement(IconComponent, {
                    name: link.icon,
                    className: 'w-5 h-5 text-foreground/70 group-hover:text-primary transition-colors'
                  }))
                )),
                React.createElement(Button, {
                  key: 'cta',
                  variant: 'cosmos',
                  size: 'lg',
                  className: 'w-full',
                  asChild: true
                }, React.createElement('a', {
                  href: 'mailto:sm11745@nyu.edu'
                }, [
                  React.createElement(IconComponent, { key: 'icon', name: 'Mail', className: 'w-4 h-4 mr-2' }),
                  'Send me a message'
                ]))
              ]),
              React.createElement(motion.div, {
                key: 'back',
                className: 'mt-8 text-center',
                initial: { opacity: 0, y: 20 },
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: true },
                transition: { delay: 0.4, duration: 0.6 }
              }, React.createElement(motion.button, {
                className: 'btn btn-cosmos-outline btn-lg group relative px-8 py-4 text-lg font-display tracking-wide overflow-hidden',
                onClick: () => {
                  playButtonSound();
                  navigate('/universe');
                },
                whileHover: { scale: 1.05, boxShadow: '0 0 30px rgba(251, 191, 36, 0.4)' },
                whileTap: { scale: 0.98 },
                transition: { type: 'spring', stiffness: 400, damping: 17 }
              }, [
                React.createElement('div', {
                  key: 'bg-gradient',
                  className: 'absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'
                }),
                React.createElement(motion.span, {
                  key: 'icon',
                  className: 'inline-flex items-center mr-3 mt-1.5',
                  whileHover: { x: -4 },
                  transition: { type: 'spring', stiffness: 400, damping: 17 }
                }, React.createElement(IconComponent, { name: 'ArrowLeft', className: 'w-5 h-5' })),
                React.createElement('span', { key: 'text', className: 'relative z-10' }, 'Back to Universe')
              ]))
            ])
          ])
        ])
      ]);
}

// Universe Page
function Universe() {
  const navigate = useNavigate();
  const { playButtonSound } = useAudio();
  const containerRef = useRef(null);
      const [isDragging, setIsDragging] = useState(false);
      const [startX, setStartX] = useState(0);
      const [scrollLeft, setScrollLeft] = useState(0);
      const [scrollOffset, setScrollOffset] = useState(0);
      const [selectedProject, setSelectedProject] = useState(null);
      const [isModalOpen, setIsModalOpen] = useState(false);
      const [isMenuOpen, setIsMenuOpen] = useState(false);
      const [showInstructions, setShowInstructions] = useState(true);

  const baseProjects = [
        {
          id: 'phoenix',
          name: 'Phoenix',
          title: 'Campus-Rush',
          description: '"Campus Rush" is a captivating  interactive comic that talks about NYUAD students real experiences of how to use a 10 minute break in between classes effectively. As a web designer, I designed the website using the cava as well as made the storyline so that not only NYUAD students but also all the students in the world can resonate with it.',
          image: 'assets/constellation-phoenix.png',
          constellationImage: 'assets/constellation-phoenix.png',
          link: 'https://darveloff.github.io/comics/',
          technologies: ['HTML', 'CSS', 'JavaScript', 'Canva'],
          position: { x: 200, y: 300 },
        },
        {
          id: 'unicorn',
          name: 'Unicorn',
          title: 'Shota\'s Productive Daily Routine',
          description: 'This is a website about my productive daily routine, teaching my audience how to spend a day productively. I used html, CSS, and Javascript to create this website, and used canva to create the wireframe.',
          image: 'assets/constellation-unicorn.png',
          constellationImage: 'assets/constellation-unicorn.png',
          link: 'https://kimshota.github.io/Communications-Lab-Assignment1/',
          technologies: ['HTML', 'CSS', 'JavaScript'],
          position: { x: 700, y: 230 },
        },
        {
          id: 'wolf',
          name: 'Wolf',
          title: 'Laundry Adventure',
          description: '“Laundry Adventure” is an interactive short film that highlights real experiences students face in the laundry room, such as people removing clothes before they’re finished or even stealing items. I played the main character, whose favorite socks get stolen by someone. As the executive web developer, I created an interactive website where users can explore different pathways to learn how they should respond in situations where their clothes are taken.',
          image: 'assets/constellation-wolf.png',
          constellationImage: 'assets/constellation-wolf.png',
          link: 'https://kimshota.github.io/laundry-story/',
          technologies: ['HTML', 'CSS', 'JavaScript'],
          position: { x: 1200, y: 300 },
        },
        {
          id: 'dragon',
          name: 'Dragon',
          title: 'Sound Detective',
          description: '“Sound Detective” is an interactive website where users restore music to a silent world by identifying instruments in distorted audio tracks after a global phenomenon called the “Great Sound Distortion” has erased all sound. As an executive web developer, I created an interactive, creepy website using HTML, CSS, and JS to effectively talk about the story. As a sound recorder, I used multiple professional sound equipment to record various instruments.',
          image: 'assets/constellation-dragon.png',
          constellationImage: 'assets/constellation-dragon.png',
          link: 'https://kimshota.github.io/sound-detective/',
          technologies: ['HTML', 'CSS', 'JavaScript', 'Sound Equipment'],
          position: { x: 1700, y: 230 },
        },
        {
          id: 'owl',
          name: 'Owl',
          title: 'Brainlot',
          description: 'BrainLot is a mobile learning app that infinitely generates MCQs from images or text input using AI and delivers them in a TikTok-style, infinite scrolling experience. I built the full end-to-end system, integrating local LLMs (llama.rn) and cloud models (Groq), implementing secure subscription verification with Supabase Edge Functions and RevenueCat, and designing a scalable backend with RLS, RPC functions, rate-limits, and upload controls. I also developed the React Native frontend, created the AI-powered MCQ generation pipeline with OCR and text chunking, and implemented secure authentication, purchase validation, and data-access enforcement.',
          image: 'assets/constellation-owl.png',
          constellationImage: 'assets/constellation-owl.png',
          link: 'https://github.com/KimShota/Brainlot',
          technologies: ['React Native', 'TypeScript', 'Supabase (Auth, Database, RLS)', 'Backend with Deno Edge Functions', 'PostgreSQL', 'RevenueCat', 'AI integration (Groq, Local LLMs)', 'OCR pipelines (Google ML Kit)'],
          position: { x: 2200, y: 300 },
        },
        {
          id: 'bear',
          name: 'Bear',
          title: 'ZEN EYE Pro',
          description: 'ZEN EYE Pro is a VR-based eye-tracking system that measures mental fatigue in just one minute by analyzing gaze patterns and blink behaviors in realistic environments, demonstrating strong ecological validity and objective accuracy. I built the system as the lead VR engineer and data scientist—programming the full Unity eye-tracking pipeline, creating real-time analytics tools, and developing the machine-learning models that processed gaze and blink data from over 2,000 participants. This work led to a validated fatigue assessment formula, 30% accuracy improvement, $163K in funding, and recognition as a Real Madrid Next Accelerator finalist, Startup World Cup top-10 finalist, and coverage on NIKKEI TV.',
          image: 'assets/constellation-bear.png',
          constellationImage: 'assets/constellation-bear.png',
          link: 'https://github.com/KimShota/ZEN-EYE',
          technologies: ['Python', 'C#', 'C++', 'Unity', 'Unreal Engine', 'Blender', 'PICO enterprise (VR)'],
          position: { x: 2700, y: 230 },
        },
        {
          id: 'deer',
          name: 'Deer',
          title: 'Short Content Creator',
          description: 'I have helped 200,000 students all around the world enhance their study efficiency and ace their exams on multiple social media platforms, such as Instagram and TikTok. Having made numerous study guides, I kept hitting millions of views on multiple videos and created my own study community to support them throughout their academic careers.',
          image: 'assets/constellation-deer.png',
          constellationImage: 'assets/constellation-deer.png',
          link: 'https://www.instagram.com/shotacademic/',
          technologies: ['CapCut', 'Resolve Davinci', 'Communication Skills', 'Problem-Solving Skills', 'Data Analysis'],
          position: { x: 3200, y: 300 },
        },
        {
          id: 'butterfly',
          name: 'Butterfly',
          title: 'VR Airflow Visualization',
          description: 'I engineered a real-time VR visualization pipeline in Unity and Blender that rendered over 50,000 airflow velocity vectors at 90 FPS through aggressive mesh batching and draw-call optimization. I reduced draw calls by 95% and stabilized frame time under 11 ms, enabling smooth exploration of large-scale flow fields in VR. I also built a Python preprocessing toolchain that downsampled massive fluid-dynamics datasets by over 90% while preserving critical flow magnitude and angle information.',
          image: 'assets/constellation-butterfly.png',
          constellationImage: 'assets/constellation-butterfly.png',
          link: 'https://github.com/KimShota/Airflow-ModelHouse',
          technologies: ['C#', 'Python', 'Unity', 'Blender'],
          position: { x: 3700, y: 230 },
        },
      ];

  const SECTION_WIDTH = 4200;
  const totalWidth = SECTION_WIDTH * 3;

  const allProjects = [
        ...baseProjects.map((p) => ({
          ...p,
          id: `${p.id}-clone-before`,
          position: { x: p.position.x, y: p.position.y },
        })),
        ...baseProjects.map((p) => ({
          ...p,
          position: { x: p.position.x + SECTION_WIDTH, y: p.position.y },
        })),
        ...baseProjects.map((p) => ({
          ...p,
          id: `${p.id}-clone-after`,
          position: { x: p.position.x + SECTION_WIDTH * 2, y: p.position.y },
        })),
      ];

      useEffect(() => {
        if (containerRef.current) {
          containerRef.current.scrollLeft = SECTION_WIDTH;
        }
      }, []);

      useEffect(() => {
    const timer = setTimeout(() => setShowInstructions(false), 5000);
        return () => clearTimeout(timer);
      }, []);

  const handleScroll = useCallback(() => {
        if (!containerRef.current) return;
    const scrollPos = containerRef.current.scrollLeft;
        setScrollOffset(scrollPos);
        if (isDragging) return;
        if (scrollPos >= SECTION_WIDTH * 2) {
          containerRef.current.scrollLeft = scrollPos - SECTION_WIDTH;
        } else if (scrollPos <= 0) {
          containerRef.current.scrollLeft = scrollPos + SECTION_WIDTH;
        }
      }, [isDragging]);

  const handleScrollEnd = useCallback(() => {
        if (!containerRef.current) return;
    const scrollPos = containerRef.current.scrollLeft;
        if (scrollPos >= SECTION_WIDTH * 2 - 100) {
          containerRef.current.scrollLeft = SECTION_WIDTH + (scrollPos - SECTION_WIDTH * 2);
        } else if (scrollPos <= 100) {
          containerRef.current.scrollLeft = SECTION_WIDTH * 2 - (100 - scrollPos);
        }
      }, []);

  const handleMouseDown = (e) => {
        if (!containerRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - containerRef.current.offsetLeft);
        setScrollLeft(containerRef.current.scrollLeft);
      };

  const handleMouseUp = () => {
        setIsDragging(false);
        handleScrollEnd();
      };

  const handleMouseMove = (e) => {
        if (!isDragging || !containerRef.current) return;
        e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    const newScrollLeft = scrollLeft - walk;
        containerRef.current.scrollLeft = newScrollLeft;
    const scrollPos = containerRef.current.scrollLeft;
        if (scrollPos >= SECTION_WIDTH * 2) {
          containerRef.current.scrollLeft = scrollPos - SECTION_WIDTH;
          setScrollLeft(containerRef.current.scrollLeft + walk);
          setStartX(x);
        } else if (scrollPos <= 0) {
          containerRef.current.scrollLeft = scrollPos + SECTION_WIDTH;
          setScrollLeft(containerRef.current.scrollLeft + walk);
          setStartX(x);
        }
      };

  const handleTouchStart = (e) => {
        if (!containerRef.current) return;
        setIsDragging(true);
        setStartX(e.touches[0].pageX - containerRef.current.offsetLeft);
        setScrollLeft(containerRef.current.scrollLeft);
      };

  const handleTouchMove = (e) => {
        if (!isDragging || !containerRef.current) return;
    const x = e.touches[0].pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    const newScrollLeft = scrollLeft - walk;
        containerRef.current.scrollLeft = newScrollLeft;
    const scrollPos = containerRef.current.scrollLeft;
        if (scrollPos >= SECTION_WIDTH * 2) {
          containerRef.current.scrollLeft = scrollPos - SECTION_WIDTH;
          setScrollLeft(containerRef.current.scrollLeft + walk);
          setStartX(x);
        } else if (scrollPos <= 0) {
          containerRef.current.scrollLeft = scrollPos + SECTION_WIDTH;
          setScrollLeft(containerRef.current.scrollLeft + walk);
          setStartX(x);
        }
      };

  const handleTouchEnd = () => {
        setIsDragging(false);
        handleScrollEnd();
      };

  const scrollTo = (direction) => {
        if (!containerRef.current) return;
    const scrollAmount = direction === 'left' ? -400 : 400;
        containerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        setTimeout(handleScrollEnd, 350);
      };

  const handleConstellationClick = (project) => {
    playButtonSound();
    const originalId = project.id.replace('-clone-before', '').replace('-clone-after', '');
    const originalProject = baseProjects.find(p => p.id === originalId) || project;
        setSelectedProject(originalProject);
        setIsModalOpen(true);
      };

  const IconComponent = ({ name, className }) => {
    const icons = {
          ArrowLeft: React.createElement('svg', { className, fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
            React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M10 19l-7-7m0 0l7-7m-7 7h18' })
          ),
          Menu: React.createElement('svg', { className, fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
            React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M4 6h16M4 12h16M4 18h16' })
          ),
          ChevronLeft: React.createElement('svg', { className, fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
            React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M15 19l-7-7 7-7' })
          ),
          ChevronRight: React.createElement('svg', { className, fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
            React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M9 5l7 7-7 7' })
          ),
        };
        return icons[name] || null;
      };

      return React.createElement('div', { className: 'relative min-h-screen overflow-hidden' }, [
        React.createElement(StarField, { key: 'stars', starCount: 800, parallaxOffset: scrollOffset }),
        React.createElement(motion.button, {
          key: 'back-btn',
          className: 'fixed top-6 left-6 z-40 p-3 rounded-full border-2 border-foreground/50 hover:border-foreground hover:bg-foreground/10 transition-all',
          onClick: () => navigate('/'),
          initial: { opacity: 0, x: -20 },
          animate: { opacity: 1, x: 0 },
          transition: { delay: 0.3 }
        }, React.createElement(IconComponent, { name: 'ArrowLeft', className: 'w-6 h-6 text-foreground' })),
        React.createElement(motion.button, {
          key: 'menu-btn',
          className: 'fixed top-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full border-2 border-foreground/50 hover:border-foreground hover:bg-foreground/10 transition-all font-display tracking-wider text-foreground',
          onClick: () => {
            playButtonSound();
            setIsMenuOpen(true);
          },
          initial: { opacity: 0, x: 20 },
          animate: { opacity: 1, x: 0 },
          transition: { delay: 0.3 }
        }, [
          React.createElement(IconComponent, { key: 'icon', name: 'Menu', className: 'w-5 h-5' }),
          React.createElement('span', { key: 'text', className: 'hidden md:inline' }, 'Menu')
        ]),
        showInstructions && React.createElement(motion.div, {
          key: 'instructions',
          className: 'fixed inset-0 z-30 flex items-center justify-center pointer-events-none',
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        }, React.createElement('div', {
          className: 'text-center text-foreground/80'
        }, [
          React.createElement('div', {
            key: 'icons',
            className: 'flex items-center justify-center gap-4 mb-4'
          }, [
            React.createElement(IconComponent, { key: 'left', name: 'ChevronLeft', className: 'w-6 h-6' }),
            React.createElement('div', { key: 'dot', className: 'w-4 h-4 rounded-full bg-foreground/50' }),
            React.createElement(IconComponent, { key: 'right', name: 'ChevronRight', className: 'w-6 h-6' })
          ]),
          React.createElement('p', { key: 'p1', className: 'text-lg font-body' }, 'Click and drag or Swipe horizontally to explore my universe.'),
          React.createElement('p', { key: 'p2', className: 'text-muted-foreground mt-2' }, 'Each constellation represents my project.'),
          React.createElement('p', { key: 'p3', className: 'text-muted-foreground' }, 'My universe loops infinitely, so keep exploring!')
        ])),
        React.createElement(motion.button, {
          key: 'scroll-left',
          className: 'fixed left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-muted/30 hover:bg-muted/50 transition-all',
          onClick: () => {
            playButtonSound();
            scrollTo('left');
          },
          initial: { opacity: 0, x: -20 },
          animate: { opacity: 1, x: 0 },
          transition: { delay: 0.5 }
        }, React.createElement(IconComponent, { name: 'ChevronLeft', className: 'w-8 h-8 text-foreground' })),
        React.createElement(motion.button, {
          key: 'scroll-right',
          className: 'fixed right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-muted/30 hover:bg-muted/50 transition-all',
          onClick: () => {
            playButtonSound();
            scrollTo('right');
          },
          initial: { opacity: 0, x: 20 },
          animate: { opacity: 1, x: 0 },
          transition: { delay: 0.5 }
        }, React.createElement(IconComponent, { name: 'ChevronRight', className: 'w-8 h-8 text-foreground' })),
        React.createElement('div', {
          key: 'container',
          ref: containerRef,
          className: `relative h-screen overflow-x-auto overflow-y-hidden hide-scrollbar ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`,
          onMouseDown: handleMouseDown,
          onMouseUp: handleMouseUp,
          onMouseLeave: handleMouseUp,
          onMouseMove: handleMouseMove,
          onTouchStart: handleTouchStart,
          onTouchEnd: handleTouchEnd,
          onTouchMove: handleTouchMove,
          onScroll: handleScroll
        }, React.createElement('div', {
          className: 'relative h-full',
          style: { width: `${totalWidth}px`, minHeight: '100vh' }
        }, allProjects.map((project) =>
          React.createElement(Constellation, {
            key: project.id,
            id: project.id,
            name: project.name,
            image: resolveAssetPath(project.constellationImage),
            position: project.position,
            onClick: () => handleConstellationClick(project)
          })
        ))),
        React.createElement(ConstellationModal, {
          key: 'modal',
          project: selectedProject,
          isOpen: isModalOpen,
          onClose: () => {
            setIsModalOpen(false);
            setSelectedProject(null);
          }
        }),
        React.createElement(MenuOverlay, {
          key: 'menu',
          isOpen: isMenuOpen,
          onClose: () => setIsMenuOpen(false)
        }),
        React.createElement(motion.div, {
          key: 'logo',
          className: 'fixed bottom-6 left-6 z-30',
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: 0.4 }
        }, React.createElement('span', {
          className: 'font-display text-lg tracking-wider text-foreground/70'
        }, [
          'SHOTA\'S',
          React.createElement('span', { key: 'span', className: 'text-primary' }, ' UNIVERSE')
        ]))
      ]);
}

// NotFound Page
function NotFound() {
  const location = useLocation();

      useEffect(() => {
        console.error("404 Error: User attempted to access non-existent route:", location.pathname);
      }, [location.pathname]);

      return React.createElement('div', {
        className: 'flex min-h-screen items-center justify-center bg-muted'
      }, React.createElement('div', {
        className: 'text-center'
      }, [
        React.createElement('h1', { key: 'title', className: 'mb-4 text-4xl font-bold' }, '404'),
        React.createElement('p', { key: 'desc', className: 'mb-4 text-xl text-muted-foreground' }, 'Oops! Page not found'),
        React.createElement('a', {
          key: 'link',
          href: '/',
          className: 'text-primary underline hover:text-primary/90'
        }, 'Return to Home')
      ]));
}

// App Component
function App() {
      return React.createElement(AudioProvider, {}, React.createElement(BrowserRouter, { basename: '/shota-portfolio/' }, React.createElement(Routes, {}, [
        React.createElement(Route, { key: '/', path: '/', element: React.createElement(Index) }),
        React.createElement(Route, { key: '/universe', path: '/universe', element: React.createElement(Universe) }),
        React.createElement(Route, { key: '/who', path: '/who', element: React.createElement(Who) }),
        React.createElement(Route, { key: '*', path: '*', element: React.createElement(NotFound) })
      ])));
}

// Render the app
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(React.createElement(App));
} else {
  console.error('Root element not found');
}
