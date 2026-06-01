import React, { useState, useEffect, useRef } from 'react';
import { Music, Activity, Clock, Sliders, Star, Info, Edit2, Search, ArrowRight, HelpCircle, AlertTriangle, Key as KeyIcon, Volume2, Sparkles, User } from 'lucide-react';
import SoundPreview from './SoundPreview';
import api from '../utils/api';

const THEORY_DATABASE = [
  {
    concept: "Mood & Tonality",
    summary: "How scales and instrument palettes define emotion.",
    details: "Mood in music is largely created by the choice of Scale (Key), Tempo, and Instrumentation. Major scales tend to sound happy or triumphant, while Minor scales sound introspective, sad, or tense. E.g. Euphoric mood uses bright synths and major keys, while Melancholic uses slow piano in minor keys."
  },
  {
    concept: "BPM & Tempo",
    summary: "Beats per minute controls the speed of your music.",
    details: "BPM stands for Beats Per Minute. It defines the tempo (speed) of a song. A resting heartbeat is around 60 BPM (ballads, slow chill), walking pace is around 120 BPM (classic house, pop, disco), and fast energy starts at 140+ BPM (techno, drum & bass)."
  },
  {
    concept: "Time Signatures",
    summary: "The rhythmic framework of a bar of music.",
    details: "Written like a fraction (e.g., 4/4, 3/4). The top number tells you how many beats are in each bar (measure). The bottom number tells you the note value. 4/4 (Common Time) sounds like a steady walking or marching beat (ONE-two-three-four), used in pop and dance music. 3/4 (Waltz) sounds like a circular, spinning dance (ONE-two-three, ONE-two-three) with a strong first beat. 6/8 has a rolling, bouncing triplet feel (ONE-two-three-FOUR-five-six)."
  },
  {
    concept: "Chord Progression",
    summary: "A sequence of chords that creates the emotional canvas.",
    details: "Chords are groups of notes played together. Moving from one chord to another creates musical tension and release. Common progressions like I-V-vi-IV form the foundation of countless hit songs."
  },
  {
    concept: "Melody Structure",
    summary: "The main hook or tune that a listener hums along to.",
    details: "Melody is a series of single notes that rise and fall. Strong melodies have balance: they use repetition, question-and-answer phrasing, and stay within a clear scale or key."
  },
  {
    concept: "Genre-Specific Instruments",
    summary: "How instrumentation defines style.",
    details: "Timbre (sound quality) defines genres. Upright bass and saxophone scream Jazz. Heavy analog synthesizers and electronic drum kits define Techno. Distorted guitars and acoustic drums form Rock."
  },
  {
    concept: "Rhythm Patterns",
    summary: "Placement of notes over time to create a groove.",
    details: "Rhythm is the engine of groove. It can be 'straight' (even divisions, like in house) or 'swung' (uneven, syncopated triplets, like in swing/jazz/hip-hop) which makes people dance or sway."
  },
  {
    concept: "Harmony",
    summary: "Multiple pitches played together for rich texture.",
    details: "Harmony supports the melody. Adding harmony notes above or below a vocal line or lead instrument makes the song sound thick, full, and emotional."
  },
  {
    concept: "Verse / Chorus Layout",
    summary: "The structural sections of a song.",
    details: "A standard song structure has Verses (tells the story, changes lyrics, lower energy) and Choruses (the main hook, repeated lyrics, highest emotional energy). Bridges provide a brief harmonic departure."
  },
  {
    concept: "Mixing & Arrangement basics",
    summary: "Layering and balancing sounds in the stereo field.",
    details: "Arrangement is laying out instruments over time. Mixing is balancing their volume, panning them left/right, and adding spatial effects (like reverb and delay) so everything sounds clean and distinct."
  }
];

const getDetailedExplanation = (conceptKey) => {
  const db = {
    mood: {
      title: "Mood & Tonality",
      explanation: "Mood in music is largely created by the choice of Scale (Key), Tempo, and Instrumentation. Major scales tend to sound happy or triumphant, while Minor scales sound introspective, sad, or tense.\n\nFor example:\n• Euphoric: Fast tempo, major chord progressions, bright synthesizers.\n• Melancholic: Slow tempo, minor chords, acoustic piano/strings.\n• Serene: Moderate tempo, soft pads, ambient reverb.",
      links: [
        { label: "Ableton: Mood and Keys", url: "https://learningmusic.ableton.com/keys-and-scales/keys-and-scales.html" },
        { label: "Wikipedia: Music and Emotion", url: "https://en.wikipedia.org/wiki/Music_and_emotion" }
      ]
    },
    genre: {
      title: "Musical Genre",
      explanation: "Genre defines the style, historical framework, and instrumentation rules of a track. Each genre has standard tempo ranges and rhythmic patterns.\n\nCommon Genres in Apollo:\n• Lofi Hip Hop: 70-90 BPM, jazzy chords, dusty vinyl crackle, laidback beat.\n• Synthwave: 100-120 BPM, heavy 80s analog synths, gated reverb snares.\n• Techno: 120-130 BPM, hypnotic repetitive sequences, strong 4/4 kick drum.",
      links: [
        { label: "Wikipedia: Music Genre", url: "https://en.wikipedia.org/wiki/Music_genre" },
        { label: "LANDR: Guide to Music Genres", url: "https://blog.landr.com/music-genres/" }
      ]
    },
    bpm: {
      title: "BPM & Tempo",
      explanation: "BPM (Beats Per Minute) controls how fast your song feels. It dictates the pacing and energy of the track.\n\nStandard Tempo Ranges:\n• Slow (60-80 BPM): Ballads, Ambient, Chillout.\n• Medium (90-115 BPM): Hip Hop, Pop, Funk.\n• Fast (120+ BPM): House, Techno, Drum & Bass (170+ BPM).",
      links: [
        { label: "Ableton: Tempo", url: "https://learningmusic.ableton.com/make-beats/tempo.html" },
        { label: "Wikipedia: Tempo", url: "https://en.wikipedia.org/wiki/Tempo" }
      ]
    },
    time_signature: {
      title: "Time Signatures",
      explanation: "Time signatures dictate how beats are grouped within a measure (bar), forming the rhythmic canvas of a song.\n\n• 4/4 (Common Time): 4 beats per bar. It has a steady, walking or marching feel with a strong pulse on the first beat (ONE-two-three-four). Most pop, rock, electronic, and hip-hop songs use 4/4 because it is easy to dance and walk to.\n\n• 3/4 (Waltz Time): 3 beats per bar. It creates a circular, spinning, or swaying dance feel (ONE-two-three, ONE-two-three). Think of classical waltzes or emotional ballads. It has a distinct 'oom-pah-pah' sound where the first beat is heavily accented.\n\n• 6/8 (Compound Time): 6 faster beats per bar, grouped in two triplets (ONE-two-three-FOUR-five-six). It sounds rolling, bouncy, or swaying (like a ship on waves), commonly used in emotional slow-rock, blues, and Irish folk music.",
      links: [
        { label: "MusicTheory.net: Time Signatures", url: "https://www.musictheory.net/lessons/12" },
        { label: "LANDR: Time Signatures Guide", url: "https://blog.landr.com/time-signatures/" }
      ]
    },
    instruments: {
      title: "Instrumentation & Timbre",
      explanation: "Timbre is the unique sound quality or color of an instrument. Choosing the right instruments defines the mood and genre.\n\n• Synthesizers: Electronic sound generation. Perfect for future/modern/sci-fi vibes.\n• Acoustic Strings: Warm, organic, emotional. Ideal for cinematic/sad/classical vibes.\n• Electric Guitar: Raw, distorted or clean. Great for rock, blues, or indie styles.",
      links: [
        { label: "Ableton: Timbre", url: "https://learningmusic.ableton.com/notes-and-scales/timbre.html" },
        { label: "Wikipedia: Timbre", url: "https://en.wikipedia.org/wiki/Timbre" }
      ]
    },
    chords: {
      title: "Chord Progressions",
      explanation: "Chords are multiple notes played together to build harmony. A progression is the sequence of chords, creating tension and emotional movement.\n\nFamous Progressions:\n• I - V - vi - IV (The Pop Loop): Used in thousands of hits.\n• ii - V - I: The foundation of Jazz.\n• i - VI - III - VII: Common in epic film scores and EDM.",
      links: [
        { label: "MusicTheory.net: Introduction to Chords", url: "https://www.musictheory.net/lessons/40" },
        { label: "Ableton: Play with Chords", url: "https://learningmusic.ableton.com/chords/play-with-chords.html" }
      ]
    },
    harmony: {
      title: "Musical Harmony",
      explanation: "Harmony is the sound of two or more notes heard simultaneously. It supports the melody and adds depth.\n\n• Consonance: Sounds stable, pleasing, and resolved.\n• Dissonance: Sounds tense, unstable, and active (wants to resolve to consonance).\n• Counterpoint: Two independent melodies playing at the same time.",
      links: [
        { label: "Wikipedia: Harmony", url: "https://en.wikipedia.org/wiki/Harmony" },
        { label: "LANDR: What is Harmony", url: "https://blog.landr.com/what-is-harmony/" }
      ]
    },
    melody: {
      title: "Melody & Hooks",
      explanation: "A melody is a linear sequence of notes that the listener hears as a single entity. It is the 'hummed' part of the song.\n\n• Intervals: The distance between pitches.\n• Motif: A short musical idea or fragment that repeats and develops.\n• Hook: The catchiest part of the song, often in the chorus.",
      links: [
        { label: "Ableton: Make Melodies", url: "https://learningmusic.ableton.com/make-melodies/make-melodies.html" },
        { label: "Wikipedia: Melody", url: "https://en.wikipedia.org/wiki/Melody" }
      ]
    },
    mixing: {
      title: "Mixing & Arrangement",
      explanation: "Mixing is balancing and combining individual tracks (vocals, drums, synths) using volume, panning, EQ, compression, and reverb/delay effects.\n\n• EQ (Equalization): Adjusting frequency ranges (bass, mids, treble).\n• Panning: Positioning sounds left-to-right in the stereo field to create space.",
      links: [
        { label: "Sound On Sound: Mixing Articles", url: "https://www.soundonsound.com/techniques/mixing" },
        { label: "LANDR: How to Mix Music", url: "https://blog.landr.com/how-to-mix-music/" }
      ]
    }
  };

  return db[conceptKey] || {
    title: "General Music Theory",
    explanation: "Music theory is the study of the practices and possibilities of music. It explains how music works and how patterns are built.",
    links: [
      { label: "Ableton: Learning Music", url: "https://learningmusic.ableton.com" },
      { label: "MusicTheory.net", url: "https://www.musictheory.net" }
    ]
  };
};

export default function CompositionPanel({ session, onGenerate, setSessionData }) {
  if (!session) return null;

  const { step, compositionState = {}, sessionId } = session;
  const { mood, genre, subGenre, bpm, timeSignature, key: musicalKey, artist, dynamics, instruments = [], recommendationWarning } = compositionState;

  const [activeTab, setActiveTab] = useState('brief'); // 'brief' | 'artists' | 'theory'
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedConcept, setExpandedConcept] = useState(null);
  
  const [artists, setArtists] = useState([]);
  const [artistsLoading, setArtistsLoading] = useState(false);

  useEffect(() => {
    const fetchArtists = async () => {
      if (!genre) {
        setArtists([]);
        return;
      }
      setArtistsLoading(true);
      try {
        const res = await api.get(`/api/chat/artists?genre=${encodeURIComponent(genre)}`);
        setArtists(res.data.artists || []);
      } catch (err) {
        console.error("Failed to fetch recommended artists:", err);
        setArtists([]);
      } finally {
        setArtistsLoading(false);
      }
    };
    fetchArtists();
  }, [genre]);
  
  // Local Chatbot widget in theory helper
  const [theoryQuery, setTheoryQuery] = useState('');
  const [theoryMessages, setTheoryMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm your Apollo Music Theory assistant. Click any ⓘ button next to the chat bubbles or ask me a theory question here to get instant explanations and online guides!",
      links: []
    }
  ]);

  const theoryChatContainerRef = useRef(null);
  const sidebarContentRef = useRef(null);
  const theoryMessagesRef = useRef(theoryMessages);

  useEffect(() => {
    theoryMessagesRef.current = theoryMessages;
    if (theoryChatContainerRef.current) {
      theoryChatContainerRef.current.scrollTo({
        top: theoryChatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [theoryMessages]);

  const executeTheoryQuery = async (queryText, fallbackFn) => {
    const userMsg = { role: 'user', content: queryText };
    const placeholderMsg = { role: 'assistant', content: 'Thinking...', loading: true };
    
    setTheoryMessages(prev => [...prev, userMsg, placeholderMsg]);

    // Scroll to the bottom to show the loading bubble
    setTimeout(() => {
      if (sidebarContentRef.current) {
        sidebarContentRef.current.scrollTo({
          top: sidebarContentRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 50);

    try {
      const res = await api.post('/api/chat/theory', {
        message: queryText,
        history: theoryMessagesRef.current.filter(m => !m.loading).slice(-8)
      });

      const assistantMsg = {
        role: 'assistant',
        content: res.data.reply,
        links: res.data.links || []
      };

      setTheoryMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx] && updated[lastIdx].loading) {
          updated[lastIdx] = assistantMsg;
        } else {
          updated.push(assistantMsg);
        }
        return updated;
      });

    } catch (err) {
      console.error("Failed to query theory assistant API, falling back to local database:", err);
      const assistantMsg = fallbackFn();
      
      setTheoryMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx] && updated[lastIdx].loading) {
          updated[lastIdx] = assistantMsg;
        } else {
          updated.push(assistantMsg);
        }
        return updated;
      });
    }
  };

  useEffect(() => {
    const handleOpenConcept = (e) => {
      console.log("Received open-theory-concept event with text:", e.detail?.content);
      if (!e.detail?.content) return;
      const originalText = e.detail.content;
      const text = originalText.toLowerCase();
      setActiveTab('theory');
      
      let conceptKey = 'general';
      let matchedIndex = -1;
      
      if (text.includes('mood') || text.includes('tonality') || text.includes('major') || text.includes('minor')) {
        conceptKey = 'mood';
        matchedIndex = 0;
      } else if (text.includes('genre') || text.includes('sub-genre') || text.includes('style')) {
        conceptKey = 'genre';
        matchedIndex = 5;
      } else if (text.includes('time signature') || text.includes('4/4') || text.includes('3/4') || text.includes('6/8')) {
        conceptKey = 'time_signature';
        matchedIndex = 2;
      } else if (text.includes('bpm') || text.includes('tempo') || text.includes('speed') || text.includes('beats per minute')) {
        conceptKey = 'bpm';
        matchedIndex = 1;
      } else if (text.includes('dynamics') || text.includes('crescendo') || text.includes('volume') || text.includes('soft') || text.includes('loud')) {
        conceptKey = 'mixing';
        matchedIndex = 9;
      } else if (text.includes('harmony') || text.includes('harmonies')) {
        conceptKey = 'harmony';
        matchedIndex = 7;
      } else if (text.includes('melody') || text.includes('tune')) {
        conceptKey = 'melody';
        matchedIndex = 4;
      } else if (text.includes('chord') || text.includes('progression')) {
        conceptKey = 'chords';
        matchedIndex = 3;
      } else if (text.includes('instrument') || text.includes('drum') || text.includes('guitar')) {
        conceptKey = 'instruments';
        matchedIndex = 5;
      }

      setSearchTerm(''); // Clear search query to keep accordion view intact
      
      if (matchedIndex !== -1) {
        setExpandedConcept(matchedIndex);
      }

      // Generate query for dynamic LLM
      let queryText = originalText;
      if (originalText.length < 50) {
        queryText = `Explain the music theory concept behind: ${originalText}`;
      } else {
        queryText = `Explain the music theory concepts in this message: "${originalText.substring(0, 150)}..."`;
      }

      const fallbackFn = () => {
        const explanationObj = getDetailedExplanation(conceptKey);
        return { 
          role: 'assistant', 
          content: explanationObj.explanation,
          links: explanationObj.links
        };
      };

      executeTheoryQuery(queryText, fallbackFn);
    };
    window.addEventListener('open-theory-concept', handleOpenConcept);
    return () => window.removeEventListener('open-theory-concept', handleOpenConcept);
  }, []);

  const handleStepJump = async (stepNum) => {
    try {
      const res = await api.post('/api/session/step', { sessionId, step: stepNum });
      if (setSessionData) {
        setSessionData(res.data.session);
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error("Failed to jump step:", err);
    }
  };

  const applyRecommendation = async () => {
    let updates = {};
    if (timeSignature && timeSignature !== "4/4") {
      updates.timeSignature = "4/4";
    }
    if (genre && genre.toLowerCase() === 'jazz' && instruments.includes('thunder drums')) {
      updates.instruments = instruments.map(i => i === 'thunder drums' ? 'jazz kit' : i);
    }
    
    if (Object.keys(updates).length > 0) {
      try {
        const res = await api.post('/api/session/update', { sessionId, updates });
        if (setSessionData) {
          setSessionData(res.data.session);
        }
      } catch (err) {
        console.error("Failed to apply recommendation:", err);
      }
    } else {
      alert("Please check with Apollo in chat to adjust your setup: 'Let's use the recommended settings.'");
    }
  };

  const handleTheorySearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleTheoryAsk = async (e) => {
    e.preventDefault();
    if (!theoryQuery.trim()) return;

    const userQueryText = theoryQuery;
    setTheoryQuery('');

    const fallbackFn = () => {
      const query = userQueryText.toLowerCase();
      
      // Local fallback parsing
      let artistQuery = null;
      if (query.includes('jackson') || query.includes('micheal') || query.includes('michael')) {
        artistQuery = {
          name: "Michael Jackson",
          desc: "Michael Jackson is renowned for Pop/Funk. Production keys: syncopated synth-bass, disco-funk drums (110-120 BPM), minor modes.",
          url: "https://en.wikipedia.org/wiki/Michael_Jackson"
        };
      }

      let fallbackReply = "";
      let fallbackLinks = [];

      if (artistQuery) {
        fallbackReply = `Here is a guide on how to sound like **${artistQuery.name}**:\n\n${artistQuery.desc}`;
        fallbackLinks = [{ label: `${artistQuery.name} on Wikipedia`, url: artistQuery.url }];
      } else {
        let conceptKey = null;
        if (query.includes('mood') || query.includes('tonality') || query.includes('major') || query.includes('minor') || query.includes('feeling')) {
          conceptKey = 'mood';
        } else if (query.includes('genre') || query.includes('style') || query.includes('lofi') || query.includes('techno') || query.includes('jazz')) {
          conceptKey = 'genre';
        } else if (query.includes('time signature') || query.includes('4/4') || query.includes('3/4') || query.includes('6/8') || query.includes('signature')) {
          conceptKey = 'time_signature';
        } else if (query.includes('bpm') || query.includes('tempo') || query.includes('speed') || query.includes('beats per minute')) {
          conceptKey = 'bpm';
        } else if (query.includes('mixing') || query.includes('eq') || query.includes('reverb') || query.includes('panning') || query.includes('pan') || query.includes('mix')) {
          conceptKey = 'mixing';
        } else if (query.includes('harmony') || query.includes('harmonies')) {
          conceptKey = 'harmony';
        } else if (query.includes('melody') || query.includes('tune') || query.includes('notes')) {
          conceptKey = 'melody';
        } else if (query.includes('chord') || query.includes('progression')) {
          conceptKey = 'chords';
        } else if (query.includes('instrument') || query.includes('drum') || query.includes('guitar') || query.includes('piano') || query.includes('synth')) {
          conceptKey = 'instruments';
        }

        if (conceptKey) {
          const explanationObj = getDetailedExplanation(conceptKey);
          fallbackReply = `I found information on **${explanationObj.title}**:\n\n${explanationObj.explanation}`;
          fallbackLinks = explanationObj.links;
        } else {
          let found = THEORY_DATABASE.find(item => 
            item.concept.toLowerCase().includes(query) || 
            item.details.toLowerCase().includes(query)
          );
          if (found) {
            fallbackReply = `Here is what I found on **${found.concept}**:\n\n${found.details}`;
          } else {
            fallbackReply = "I couldn't find a direct match. Try asking about 'BPM', 'time signature', 'chords', 'harmony', 'melody', 'instruments', 'mood', or 'mixing'.";
          }
          fallbackLinks = [
            { label: "Ableton: Learning Music", url: "https://learningmusic.ableton.com" },
            { label: "MusicTheory.net", url: "https://www.musictheory.net" }
          ];
        }
      }

      return {
        role: 'assistant',
        content: fallbackReply,
        links: fallbackLinks
      };
    };

    await executeTheoryQuery(userQueryText, fallbackFn);
  };

  const filteredConcepts = THEORY_DATABASE.filter(item => 
    item.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const InfoRow = ({ icon: Icon, label, value, stepLink }) => (
    <div className="flex items-center gap-3 py-2.5 border-b border-[var(--hairline)] last:border-0 group">
      <div className="p-1.5 bg-[var(--surface)] rounded-md text-[var(--accent)]">
        <Icon size={12} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wider font-semibold">{label}</div>
        <div className={`text-[13px] font-medium truncate capitalize ${value ? 'text-[var(--ink)]' : 'text-[var(--ink-muted)] italic'}`}>
          {value || 'Pending...'}
        </div>
      </div>
      {stepLink && (
        <button 
          onClick={() => handleStepJump(stepLink)}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[var(--surface-hover)] rounded text-[var(--ink-secondary)] hover:text-[var(--accent-glow)] transition-all cursor-pointer"
          title={`Go back to Step ${stepLink}`}
        >
          <Edit2 size={12} />
        </button>
      )}
    </div>
  );

  return (
    <div className="h-full bg-transparent flex flex-col font-sans">
      {/* Header */}
      <div className="p-[20px] border-b border-[var(--hairline)] bg-transparent shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-[var(--accent)] p-1.5 rounded-[6px] shadow-[0_0_15px_var(--accent-muted)]">
            <Music size={16} className="text-[var(--ink)]" />
          </div>
          <h2 className="text-[18px] font-bold text-[var(--ink)] tracking-tight font-['Space_Grotesk']">
            Apollo Assistant
          </h2>
        </div>
        
        {/* Tabs navigation */}
        <div className="flex bg-[var(--canvas)] p-[3px] rounded-lg mt-4 border border-[var(--hairline)]">
          <button 
            onClick={() => setActiveTab('brief')}
            className={`flex-1 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-md transition-all cursor-pointer ${activeTab === 'brief' ? 'bg-[var(--accent)] text-white shadow-[0_0_12px_rgba(124,58,237,0.35)]' : 'text-[var(--ink-secondary)] hover:text-white'}`}
          >
            Brief
          </button>
          <button 
            onClick={() => setActiveTab('artists')}
            className={`flex-1 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-md transition-all cursor-pointer ${activeTab === 'artists' ? 'bg-[var(--accent)] text-white shadow-[0_0_12px_rgba(124,58,237,0.35)]' : 'text-[var(--ink-secondary)] hover:text-white'}`}
          >
            Artists
          </button>
          <button 
            onClick={() => setActiveTab('theory')}
            className={`flex-1 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-md transition-all cursor-pointer ${activeTab === 'theory' ? 'bg-[var(--accent)] text-white shadow-[0_0_12px_rgba(124,58,237,0.35)]' : 'text-[var(--ink-secondary)] hover:text-white'}`}
          >
            Theory
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div 
        ref={sidebarContentRef}
        className="flex-1 overflow-y-auto p-[20px] space-y-5 custom-scrollbar"
      >
        {activeTab === 'brief' ? (
          <>
            {/* Journey Progress */}
            <section>
              <div className="flex justify-between items-end mb-2">
                <h3 className="text-[11px] font-bold text-[var(--ink-secondary)] uppercase tracking-[0.1em]">Journey Progress</h3>
                <span className="text-[11px] font-mono text-[var(--accent)]">{step}/12</span>
              </div>
              <div className="h-1.5 w-full bg-[var(--surface)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--accent)] transition-all duration-500 shadow-[0_0_10px_var(--accent-muted)]" 
                  style={{ width: `${(step / 12) * 100}%` }}
                />
              </div>
            </section>

            {/* Smart recommendation Warning */}
            {recommendationWarning?.hasWarning && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col gap-2">
                <div className="flex gap-2 text-[var(--warning)] items-start">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Theory Advisory</span>
                </div>
                <p className="text-[12px] text-[var(--ink-secondary)] leading-relaxed">
                  {recommendationWarning.message}
                </p>
                <button
                  onClick={applyRecommendation}
                  className="w-full mt-1 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-[11px] text-[var(--ink)] border border-amber-500/40 rounded-md transition-all cursor-pointer font-medium"
                >
                  View Suggestion Details
                </button>
              </div>
            )}

            {/* Structured Info with Step Jumping */}
            <section className="bg-[var(--surface)] p-3.5 rounded-xl border border-[var(--hairline)] space-y-1">
              <InfoRow icon={Activity} label="Mood" value={mood} stepLink={1} />
              <InfoRow icon={KeyIcon} label="Key" value={musicalKey} stepLink={2} />
              <InfoRow icon={Music} label="Genre" value={genre} stepLink={3} />
              <InfoRow icon={Sliders} label="Sub-Genre" value={subGenre} stepLink={4} />
              <InfoRow icon={User} label="Inspiration" value={artist} stepLink={8} />
              <InfoRow icon={Clock} label="Tempo" value={bpm ? `${bpm} BPM` : null} stepLink={7} />
              <InfoRow icon={HelpCircle} label="Signature" value={timeSignature} stepLink={6} />
              <InfoRow icon={Volume2} label="Dynamics" value={dynamics} stepLink={10} />
            </section>

            {/* Instruments */}
            <section>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-[11px] font-bold text-[var(--ink-secondary)] uppercase tracking-[0.1em] flex items-center gap-1.5">
                  <Star size={12} className="text-[var(--accent)]" /> Orchestra
                </h3>
                <button 
                  onClick={() => handleStepJump(5)}
                  className="text-[10px] text-[var(--accent)] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  Edit Instruments
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {instruments && instruments.length > 0 ? (
                  instruments.map((inst, i) => (
                    <span key={i} className="px-2.5 py-0.5 bg-[var(--surface)] border border-[var(--hairline)] rounded-full text-[11px] text-[var(--ink)] font-medium capitalize">
                      {inst}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-[var(--ink-muted)] italic">Awaiting selection...</span>
                )}
              </div>
            </section>

            <SoundPreview />

            <div className="p-3.5 rounded-xl bg-gradient-to-br from-[var(--accent-muted)] to-transparent border border-[var(--accent-muted)] opacity-85">
               <p className="text-[11px] text-[var(--ink-secondary)] leading-relaxed italic">
                 "Apollo automatically synchronizes details based on our conversation flow."
               </p>
            </div>
          </>
        ) : activeTab === 'artists' ? (
          /* Recommended Artists Tab */
          <div className="space-y-4">
            <div className="p-3 bg-[var(--accent-muted)]/10 border border-[var(--accent-muted)]/20 rounded-xl">
              <h3 className="text-[12px] font-bold text-[var(--accent)] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} /> AI Artist Recommendations
              </h3>
              <p className="text-[11px] text-[var(--ink-secondary)] mt-1.5 leading-relaxed">
                Discover key artists that define the <strong>{genre || 'selected'}</strong> genre and learn about their signature musical choices to inspire your track.
              </p>
            </div>

            {artistsLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-[var(--ink-secondary)]">
                <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[11px]">Generating profiles...</span>
              </div>
            ) : !genre ? (
              <div className="text-center py-8 text-[var(--ink-muted)] text-[12px] italic">
                Please select a genre in the chat first to get artist recommendations.
              </div>
            ) : artists.length === 0 ? (
              <div className="text-center py-8 text-[var(--ink-muted)] text-[12px] italic">
                No recommended artists found for this genre. Keep chatting to refine your choices!
              </div>
            ) : (
              <div className="space-y-3.5">
                {artists.map((artist, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-[var(--hairline)] bg-[var(--surface)] hover:border-[var(--accent)] transition-all flex flex-col gap-2.5 shadow-sm">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[13px] font-bold text-[var(--ink)] flex items-center gap-1.5">
                        <User size={13} className="text-[var(--accent)]" /> {artist.name}
                      </h4>
                      <span className="text-[10px] bg-[var(--accent-muted)] text-[var(--ink)] px-2 py-0.5 rounded-full font-medium">
                        Blueprint
                      </span>
                    </div>
                    
                    <p className="text-[11.5px] text-[var(--ink-secondary)] leading-relaxed font-['Inter']">
                      {artist.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mt-1 border-t border-[var(--hairline)]/60 pt-2.5 text-[10px]">
                      <div>
                        <span className="text-[var(--ink-muted)] block uppercase font-bold tracking-wide">Typical Tempo</span>
                        <span className="text-[var(--ink)] font-medium">{artist.bpm}</span>
                      </div>
                      <div>
                        <span className="text-[var(--ink-muted)] block uppercase font-bold tracking-wide">Key/Tonality</span>
                        <span className="text-[var(--ink)] font-medium">{artist.key}</span>
                      </div>
                      <div className="mt-1.5">
                        <span className="text-[var(--ink-muted)] block uppercase font-bold tracking-wide">Dynamics Curve</span>
                        <span className="text-[var(--ink)] font-medium">{artist.dynamics}</span>
                      </div>
                      <div className="mt-1.5">
                        <span className="text-[var(--ink-muted)] block uppercase font-bold tracking-wide">Core Timbre</span>
                        <span className="text-[var(--ink)] font-medium truncate block" title={artist.instruments}>
                          {artist.instruments}
                        </span>
                      </div>
                    </div>

                    <div className="bg-[var(--canvas)] p-2 rounded-lg border border-[var(--hairline)] mt-1 flex items-start gap-1.5">
                      <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wide shrink-0 mt-0.5">Tip:</span>
                      <p className="text-[10px] text-[var(--ink-secondary)] italic leading-normal">
                        {artist.fun_fact}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Theory Guide Tab */
          <div className="space-y-4">
            {/* Concept Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-[var(--ink-muted)]" />
              <input 
                type="text" 
                placeholder="Search music concepts..."
                value={searchTerm}
                onChange={handleTheorySearch}
                className="w-full bg-[var(--surface)] border border-[var(--hairline)] rounded-lg py-1.5 pl-9 pr-4 text-[12px] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] placeholder-[var(--ink-muted)] font-['Inter']"
              />
            </div>

            {/* Accordion Database */}
            <div className="space-y-2">
              {filteredConcepts.map((item, idx) => {
                const isOpen = expandedConcept === idx;
                return (
                  <div key={idx} className="border border-[var(--hairline)] rounded-xl overflow-hidden bg-[var(--surface)]">
                    <button 
                      onClick={() => setExpandedConcept(isOpen ? null : idx)}
                      className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-[var(--surface-hover)] transition-all cursor-pointer"
                    >
                      <div>
                        <h4 className="text-[13px] font-bold text-[var(--ink)]">{item.concept}</h4>
                        {!isOpen && <p className="text-[11px] text-[var(--ink-secondary)] mt-0.5 truncate">{item.summary}</p>}
                      </div>
                      <span className="text-[10px] text-[var(--ink-muted)] font-mono">{isOpen ? '▲' : '▼'}</span>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-3 pt-1 border-t border-[var(--hairline)] bg-[var(--canvas-overlay)]">
                        <p className="text-[12px] text-[var(--ink-secondary)] leading-relaxed font-['Inter']">
                          {item.details}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Interactive Chatbot widget */}
            <div className="border border-[var(--accent-muted)] rounded-xl p-3 bg-gradient-to-b from-[var(--canvas-overlay)] to-[var(--surface)] mt-4 flex flex-col gap-2">
              <h4 className="text-[12px] font-bold text-[var(--ink)] flex items-center gap-1.5 shrink-0">
                <Info size={12} className="text-[var(--accent)]" /> Theory Assistant Chat
              </h4>
              
              {/* Chat Messages Log */}
              <div 
                ref={theoryChatContainerRef}
                className="max-h-[220px] overflow-y-auto space-y-2.5 pr-1 text-[12px] scrollbar-thin"
              >
                {theoryMessages.map((msg, i) => {
                  const isUserMsg = msg.role === 'user';
                  return (
                    <div key={i} className={`flex flex-col ${isUserMsg ? 'items-end' : 'items-start'}`}>
                      <div className={`p-2.5 rounded-lg max-w-[90%] whitespace-pre-wrap leading-relaxed font-['Inter']
                        ${isUserMsg 
                          ? 'bg-[var(--accent-muted)] text-[var(--ink)] rounded-br-none border border-[var(--accent-deep)]' 
                          : 'bg-[var(--canvas)] text-[var(--ink-secondary)] rounded-bl-none border border-[var(--hairline)]'
                        }
                      `}>
                        {msg.loading ? (
                          <div className="flex items-center gap-1 py-1">
                            <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:0.4s]"></span>
                          </div>
                        ) : (
                          msg.content
                        )}
                        
                        {/* Render Links */}
                        {!msg.loading && msg.links && msg.links.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-[var(--hairline)] flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold text-[var(--ink-muted)] uppercase tracking-wider">References:</span>
                            <div className="flex flex-wrap gap-2">
                              {msg.links.map((link, linkIdx) => (
                                <a 
                                  key={linkIdx} 
                                  href={link.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-[var(--accent)] hover:underline inline-flex items-center gap-0.5"
                                >
                                  {link.label} ↗
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {/* Scroll Anchor */}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleTheoryAsk} className="flex gap-2 mt-1 shrink-0">
                <input 
                  type="text"
                  placeholder="Ask a theory question..."
                  value={theoryQuery}
                  onChange={(e) => setTheoryQuery(e.target.value)}
                  className="flex-1 bg-[var(--canvas)] border border-[var(--hairline)] rounded-lg px-2.5 py-1 text-[11px] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] placeholder-[var(--ink-muted)]"
                />
                <button 
                  type="submit"
                  className="p-1.5 bg-[var(--accent)] hover:bg-[var(--accent-glow)] rounded-lg text-white flex items-center justify-center cursor-pointer transition-all active:scale-95"
                >
                  <ArrowRight size={13} />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer Button */}
      <div className="p-[20px] bg-transparent border-t border-[var(--hairline)] shrink-0">
        <button 
          onClick={onGenerate}
          disabled={step < 4}
          className={`w-full py-[12px] px-[20px] rounded-[10px] text-[14px] font-bold transition-all active:scale-[0.97] block disabled:opacity-40 disabled:cursor-not-allowed
            ${step >= 4 
              ? 'bg-[var(--accent)] text-white cursor-pointer accent-glow-button' 
              : 'bg-[var(--surface)] text-[var(--ink-muted)] cursor-not-allowed'}
          `}
        >
          {step >= 12 ? 'Generate Final Track' : 'Generate Now (Quick)'}
        </button>
      </div>
    </div>
  );
}
