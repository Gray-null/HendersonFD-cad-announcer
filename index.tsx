import React, { useState, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Modality } from "@google/genai";

// --- DATA CONSTANTS ---

const APPARATUS_ROSTER = [
  "Engine 81", "Rescue 81",
  "Engine 82", "Truck 82", "Heavy Rescue 82", "Rescue 282", "Medic 82", "Battalion 8", "OSO",
  "Engine 83", "Rescue 83", "Rescue 283",
  "Engine 84", "Rescue 84",
  "Engine 85", "Rescue 85",
  "Engine 86",
  "Engine 87", "Rescue 87",
  "Engine 91",
  "Engine 92", "Rescue 92",
  "Engine 95", "Rescue 95", "Rescue 295",
  "Engine 97", "Rescue 97", "Medic 97",
  "Engine 98", "Truck 98", "Hazmat 98", "Rescue 98", "Battalion 9",
  "Engine 99", "Rescue 99",
  "Battalion 14",
];

const EMS_PROTOCOLS: Record<string, Record<string, string[]>> = {
    "Alpha": {
        "Abdominal Pain": ["1A1 Abdominal pain"],
        "Allergic Reaction": ["2A1 No difficulty breathing or swallowing", "2A2 Spider bite"],
        "Animal Bites": ["3A1 Not dangerous body area", "3A2 Non-recent injuries >6 hours", "3A3 Superficial bites"],
        "Assault": ["4A1 Not dangerous body area", "4A2 Non-recent injuries >6 hours"],
        "Back Pain": ["5A1 Non-traumatic", "5A2 Non-recent injuries >6 hours"],
        "Breathing Difficulty": [],
        "Burn Subject": ["7A1 Burns < 18% BSA", "7A2 Fire alarm unknown situation", "7A3 Sunburn or minor burn"],
        "Hazardous Exposure": ["8A1 CO alarm--EMS requested"],
        "Cardiac Arrest": [],
        "Chest Pain": ["10A1 Breathing normally <35 y/o"],
        "Choking": ["11A1 Not choking now"],
        "Seizures": ["12A1 Not seizing now & breathing verified"],
        "Diabetic Problems": ["13A1 Alert"],
        "Drowning": ["14A1 Alert & breathing normally w/o injuries"],
        "Electrocution": [],
        "Eye Problem": ["16A1 Moderate eye injuries", "16A2 Minor eye injuries", "16A3 Medical eye problems"],
        "Falls": ["17A1 Not dangerous body area", "17A2 Non-recent injuries >6 hours"],
        "Headache": ["18A1 Breathing normally"],
        "Heart Problem": ["19A1 Heart rate >50 or 5 months", "19A2 Chest pain <35 y/o w/o symptoms"],
        "Environmental Exposure": ["20A1 Alert"],
        "Hemorrhage": ["21A1 Non-dangerous hemorrhage", "21A2 Minor hemorrhage"],
        "Industrial Accidents": [],
        "Overdose": [],
        "Pregnancy": ["24A1 1st trimester hemorrhage or miscarriage"],
        "Psychiatric Problem": ["25A1 Non-violent & non-suicidal"],
        "Sick Call": ["26A1 Non priority symptoms", "26A2 Boils", "26A3 Bumps", "26A4 Cannot sleep", "26A5 Cannot urinate", "26A6 Catheter problems", "26A7 Constipation", "26A8 Cramps/spasms", "26A9 Cut-off ring request", "26A10 Deafness", "26A11 Defecation/diarrhea", "26A12 Earache", "26A13 Enema", "26A14 Gout", "26A15 Hemorrhoids/piles", "26A16 Hepatitis", "26A17 Hiccups", "26A18 Hungry", "26A19 Nervous", "26A20 Object stuck", "26A21 Object swallowed", "26A22 Penis problems", "26A23 Rash/skin disorder", "26A24 STD", "26A25 Sore throat", "26A26 Toothache", "26A27 Transport only", "26A28 Wound infected"],
        "Stab/Gunshot/Penetrating Trauma": ["27A1 Non-recent >6 hours / peripheral wounds"],
        "Stroke": ["28A1 Breathing normally 6 hours"],
        "Traffic Collision": ["29A1 1st party caller w/ non-dangerous injury"],
        "Traumatic Injuries": ["30-A-1 Not Dangerous body area", "30-A-2 Non-Recent injuries (>= 6hrs)"],
        "Subject Unconscious": ["31C5 Female 12-50 y/o w/ abdominal pain"],
        "Medical Nature Unknown": [],
        "Transfer": ["33A1 No priority symptoms"]
    },
    "Bravo": {
        "Allergic Reaction": ["2B1 Unknown status (3rd party caller)"],
        "Animal Bites": ["3B1 Possibly dangerous body part", "3B2 Serious hemorrhage", "3B3 Unknown status (3rd party caller)"],
        "Assault": ["4B1 Possibly dangerous body area", "4B2 Serious hemorrhage", "4B3 Unknown status (3rd party caller)"],
        "Burn Subject": ["7B1 Unknown status (3rd party caller)"],
        "Hazardous Exposure": ["8B1 Alert w/o difficulty breathing"],
        "Cardiac Arrest": ["9B1 Obvious Death"],
        "Seizures": ["12B1 Breathing regularly not verified 6 feet"],
        "Drowning": ["14B1 Alert & breathing normally w/ injuries", "14B2 Unknown status(3rd party caller)"],
        "Eye Problem": ["16B1 Severe eye injuries"],
        "Falls": ["17B1 Possibly dangerous body area", "17B2 Serious hemorrhage", "17B3 Unknown status (3rd party caller)"],
        "Heart Problem": ["19B1 Unknown status (3rd party caller)"],
        "Environmental Exposure": ["20B1 Change in skin color", "20B2 Unknown status (3rd party caller)"],
        "Hemorrhage": ["21B1 Possibly dangerous hemorrhage", "21B2 Serious hemorrhage", "21B3 Bleeding disorder or blood thinners"],
        "Industrial Accidents": ["22B1 Unknown status (3rd party caller)"],
        "Overdose": ["23B1 Overdose w/o symptoms"],
        "Pregnancy": ["24B1 Labor >5 months", "24B2 Unknown status (3rd party caller)"],
        "Psychiatric Problem": ["25B1 Violent", "25B2 Threatening suicide", "25B3 Near hanging", "25B4 Unknown status (3rd party caller)"],
        "Sick Call": ["26B1 Unknown status (3rd party caller)"],
        "Stab/Gunshot/Penetrating Trauma": ["27B1 Non-recent injuries >6 hours / central wounds", "27B2 Known single peripheral wound", "27B3 Serious hemorrhage", "27B4 Unknown status (3rd party caller)"],
        "Stroke": ["28B1 Unknown status (3rd party caller)"],
        "Traffic Collision": ["29B1 Injuries", "29B2 Multiple victims (one unit)", "29B3 Multiple victims (additional units)", "29B4 Serious hemorrhage", "29B5 Unknown status (3rd party caller)"],
        "Traumatic Injuries": ["30-B-1 Possibly Dangerous body area", "30-B-2 Serious hemorrhage"],
        "Medical Nature Unknown": ["32B1 Standing, moving, sitting, or talking", "32B2 Medical alert notification", "32B3 Unknown status (3rd party caller)"]
    },
    "Charlie": {
        "Abdominal Pain": ["1C1 Fainting or near fainting >50 y/o", "1C2 Females fainting or near fainting 12-50 y/o", "1C3 Males w/ pain above navel >45 y/o", "1C4 Females w/ pain above navel >45 y/o"],
        "Allergic Reaction": ["2C1 Difficulty breathing or swallowing", "2C2 Special medications or injections used"],
        "Back Pain": ["5C1 Fainting or near fainting >50 y/o"],
        "Breathing Difficulty": ["6C1 Abnormal breathing", "6C2 Cardiac history"],
        "Burn Subject": ["7C1 Building fire w/ persons inside", "7C2 Difficulty breathing", "7C3 Burns >18% BSA"],
        "Hazardous Exposure": ["8C1 Alert w/ difficulty breathing"],
        "Chest Pain": ["10C1 Abnormal breathing", "10C2 Cardiac history", "10C3 Cocaine", "10C4 Breathing normally >35 y/o"],
        "Seizures": ["12C1 Pregnancy", "12C2 Diabetic", "12C3 Cardiac history"],
        "Diabetic Problems": ["13C1 Not alert", "13C2 Abnormal behavior", "13C3 Abnormal breathing"],
        "Drowning": ["14C1 Alert w/ abnormal breathing"],
        "Electrocution": ["15C1 Alert & breathing normally"],
        "Headache": ["18C1 Not alert", "18C2 Abnormal breathing", "18C3 Speech problems", "18C4 Sudden onset of severe pain", "18C5 Numbness or paralysis", "18C6 Change in behavior"],
        "Heart Problem": ["19C1 Firing of AICD", "19C2 Abnormal breathing", "19C3 Chest pain >35 y/o", "19C4 Cardiac history", "19C5 Cocaine", "19C6 Heart rate 130"],
        "Environmental Exposure": ["20C1 Cardiac history"],
        "Hemorrhage": ["21C1 Hemorrhage through a tube"],
        "Overdose": ["23C1 Violent", "23C2 Not alert", "23C3 Abnormal breathing", "23C4 Antidepressants", "23C5 Cocaine", "23C6 Narcotics", "23C7 Acid or alkali", "23C8 Unknown status (3rd party caller)", "23C9 Poison Control request for response"],
        "Pregnancy": ["24C1 2nd trimester hemorrhage or miscarriage", "24C2 1st trimester serious hemorrhage"],
        "Sick Call": ["26C1 Cardiac History"],
        "Stroke": ["28C1 Not alert", "28C2 Abnormal breathing", "28C3 Speech or movement problems", "28C4 Numbness or tingling", "28C5 Stoke history", "28C6 Breathing normally >35 y/o"],
        "Subject Unconscious": ["31C1 Alert w/ abnormal breathing", "31C2 Cardiac history", "31C3 Multiple fainting episodes", "31C4 Single or near fainting episodes & alert"],
        "Transfer": ["33C1 Not alert (acute change)", "33C2 Abnormal breathing", "33C3 Significant hemorrhage or shock", "33C4 Possible acute heart problems or MI", "33C5 Acute severe pain", "33C6 Emergency response requested"]
    },
    "Delta": {
        "Abdominal Pain": ["1D1 Not alert"],
        "Allergic Reaction": ["2D1 Severe respiratory distress", "2D2 Not alert", "2D3 Condition worsening", "2D4 Swarm attack (bees)", "2D5 Snakebite"],
        "Animal Bites": ["3D1 Unconscious or arrest", "3D2 Not alert", "3D3 Dangerous body area", "3D4 Large animal", "3D5 Exotic animal", "3D6 Attack or multiple attack"],
        "Assault": ["4D1 Unconscious or arrest", "4D2 Not alert", "4D3 Abnormal breathing", "4D4 Dangerous body area", "4D5 Multiple victims"],
        "Back Pain": ["5D1 Not alert"],
        "Breathing Difficulty": ["6D1 Severe respiratory distress", "6D2 Not alert", "6D3 Clammy"],
        "Burn Subject": ["7D1 Unconscious or arrest", "7D2 Severe respiratory distress", "7D3 Not alert", "7D4 Explosion", "7D5 Multiple victims"],
        "Hazardous Exposure": ["8D1 Unconscious or arrest", "8D2 Severe respiratory distress", "8D3 HAZMAT", "8D4 Not alert", "8D5 Multiple victims", "8D6 Unknown status (3rd party caller)"],
        "Cardiac Arrest": ["9D1 Ineffective breathing"],
        "Chest Pain": ["10D1 Severe respiratory distress", "10D2 Not alert", "10D3 Clammy"],
        "Choking": ["11D1 Not alert", "11D2 Abnormal breathing"],
        "Seizures": ["12D1 Not breathing", "12D2 Continuous or multiple seizures", "12D3 Irregular breathing", "12D4 Breathing regularly not verified >35 y/o"],
        "Diabetic Problems": ["13D1 Unconscious"],
        "Drowning": ["14D1 Unconscious", "14D2 Not alert", "14D3 Diving or neck injury", "14D4 SCUBA accident"],
        "Electrocution": ["15D1 Unconscious", "15D2 Not disconnected from power", "15D3 Power not off", "15D4 Long fall >6 feet", "15D5 Not alert", "15D6 Abnormal breathing", "15D7 Unknown status (3rd party caller)"],
        "Eye Problem": ["16D1 Not alert"],
        "Falls": ["17D1 Dangerous body area", "17D2 Long fall >6 feet", "17D3 Not alert", "17D4 Abnormal breathing"],
        "Heart Problem": ["19D1 Severe respiratory distress", "19D2 Not alert", "19D3 Clammy"],
        "Environmental Exposure": ["20D1 Not alert"],
        "Hemorrhage": ["21D1 Dangerous hemorrhage", "21D2 Not alert", "21D3 Abnormal breathing"],
        "Industrial Accidents": ["22D1 Life status questionable", "22D2 Caught in machinery", "22D3 Multiple victims"],
        "Overdose": ["23D1 Unconscious", "23D2 Severe respiratory distress"],
        "Pregnancy": ["24D1 Breech or cord", "24D2 Head visible", "24D3 Imminent delivery >5 months", "24D4 3rd trimester bleeding", "24D5 High risk complications", "24D6 Baby born"],
        "Psychiatric Problem": ["25D1 Not alert"],
        "Sick Call": ["26D1 Not alert"],
        "Stab/Gunshot/Penetrating Trauma": ["27D1 Unconscious or arrest", "27D2 Not alert", "27D3 Central wounds", "27D4 Multiple wounds", "27D5 Multiple victims"],
        "Traffic Collision": ["29D1A Major incident (aircraft)", "29D1B Major incident (bus)", "29D1D Major incident (train)", "29D1E Major incident (watercraft)", "29D2A High mechanism (all-terrain)", "29D2B High mechanism (motorcycle)", "29D2C High mechanism (auto-ped)", "29D2D High mechanism (ejection)", "29D2E High mechanism (personal watercraft)", "29D2F High mechanism (rollover)", "29D2G High mechanism (vehicle off bridge/height)", "29D3 HAZMAT", "29Delta4 Entrapment", "29D5 Not alert"],
        "Traumatic Injuries": ["30-D-1 Dangerous body area", "30-D-2 Not alert", "30-D-3 Abnormal breathing"],
        "Subject Unconscious": ["31D1 Unconscious", "31D2 Severe respiratory distress", "31D3 Not alert"],
        "Medical Nature Unknown": ["32D1 Life status questionable"],
        "Transfer": ["33D1 Suspected cardiac or respiratory arrest"]
    },
    "Echo": {
        "Allergic Reaction": ["2E1 Ineffective breathing"],
        "Breathing Difficulty": ["6E1 Ineffective breathing"],
        "Cardiac Arrest": ["9E1 Not breathing at all", "9E2 Breathing uncertain", "9E3 Hanging", "9E4 Strangulation", "9E5 Suffocation", "9E6 Underwater"],
        "Choking": ["11E1 Choking verified/ineffective breathing"],
        "Electrocution": ["15E1 Not breathing/ineffective breathing"],
        "Subject Unconscious": ["31E1 Ineffective breathing"]
    }
};

const FIRE_PROTOCOLS: Record<string, string[]> = {
    "Structure Fire": ["Single Family", "Multi-Family", "Commercial", "High-Rise"],
    "Vehicle Fire": ["Car", "Truck/Bus", "RV", "Boat"],
    "Alarms": ["Fire Alarm", "CO Alarm", "Smoke Detector"],
    "Hazardous Materials": ["Fuel Spill", "Gas Leak", "Chemical Spill"],
    "Rescue": ["Technical Rescue", "Water Rescue", "Vehicle Extrication"],
    "Other": ["Brush Fire", "Trash Fire", "Illegal Burn", "Smoke Investigation"],
};

// --- AUDIO HELPER FUNCTIONS ---

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // The raw audio data is 16-bit PCM.
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Normalize the 16-bit signed integer to a float between -1.0 and 1.0
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


// --- HELPER COMPONENTS ---

const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = "" }) => (
    <div className={`bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
        <h2 className="text-xl font-bold mb-4 text-cyan-400">{title}</h2>
        {children}
    </div>
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select {...props} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50" />
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
);

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }> = ({ children, variant = 'primary', ...props }) => {
  const baseClasses = "w-full font-bold py-2 px-4 rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900";
  const variantClasses = variant === 'primary' 
    ? "bg-cyan-600 hover:bg-cyan-700 focus:ring-cyan-500 text-white"
    : "bg-gray-600 hover:bg-gray-700 focus:ring-gray-500 text-gray-200";
  return (
    <button {...props} className={`${baseClasses} ${variantClasses}`}>
      {children}
    </button>
  );
};


// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
    // State Initialization with robust defaults
    const getInitialState = () => {
        const dispatchType = 'Medical';
        const protocol = Object.keys(EMS_PROTOCOLS)[0];
        const mainCallType = Object.keys(EMS_PROTOCOLS[protocol])[0];
        const subCallType = EMS_PROTOCOLS[protocol][mainCallType]?.[0] || '';
        return { dispatchType, protocol, mainCallType, subCallType };
    };
    
    const initialState = getInitialState();

    const [dispatchType, setDispatchType] = useState<'Medical' | 'Fire'>(initialState.dispatchType as 'Medical' | 'Fire');
    const [protocol, setProtocol] = useState(initialState.protocol);
    const [mainCallType, setMainCallType] = useState(initialState.mainCallType);
    const [subCallType, setSubCallType] = useState(initialState.subCallType);

    const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
    const [mapPages, setMapPages] = useState('');
    const [phantomPage, setPhantomPage] = useState('');
    const [crossStreets, setCrossStreets] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [holdForPD, setHoldForPD] = useState(false);
    const [useAlertTone, setUseAlertTone] = useState(true);
    const [speechRate, setSpeechRate] = useState(1.0);
    
    const audioContextRef = useRef<AudioContext | null>(null);

    // Robust Handlers for Dropdown Changes
    const handleDispatchTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDispatchType = e.target.value as 'Medical' | 'Fire';
        setDispatchType(newDispatchType);

        if (newDispatchType === 'Medical') {
            const newProtocol = Object.keys(EMS_PROTOCOLS)[0];
            const newMainCallType = Object.keys(EMS_PROTOCOLS[newProtocol])[0];
            const newSubTypes = EMS_PROTOCOLS[newProtocol][newMainCallType] || [];
            setProtocol(newProtocol);
            setMainCallType(newMainCallType);
            setSubCallType(newSubTypes[0] || '');
        } else { // Fire
            const newMainCallType = Object.keys(FIRE_PROTOCOLS)[0];
            const newSubTypes = FIRE_PROTOCOLS[newMainCallType] || [];
            setProtocol('');
            setMainCallType(newMainCallType);
            setSubCallType(newSubTypes[0] || '');
        }
    };

    const handleProtocolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newProtocol = e.target.value;
        const mainCallTypes = EMS_PROTOCOLS[newProtocol] || {};
        const newMainCallType = Object.keys(mainCallTypes)[0] || '';
        const newSubTypes = mainCallTypes[newMainCallType] || [];

        setProtocol(newProtocol);
        setMainCallType(newMainCallType);
        setSubCallType(newSubTypes[0] || '');
    };

    const handleMainCallTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newMainCallType = e.target.value;
        setMainCallType(newMainCallType);

        if (dispatchType === 'Medical') {
            const newSubTypes = (EMS_PROTOCOLS[protocol] && EMS_PROTOCOLS[protocol][newMainCallType]) || [];
            setSubCallType(newSubTypes[0] || '');
        } else { // Fire
            const newSubTypes = FIRE_PROTOCOLS[newMainCallType] || [];
            setSubCallType(newSubTypes[0] || '');
        }
    };
    
    const handleUnitSelection = (unit: string) => {
        setSelectedUnits(prev =>
            prev.includes(unit) ? prev.filter(u => u !== unit) : [...prev, unit]
        );
    };

    // Derived values for dropdown options (SAFE RENDERING)
    const mainCallTypeOptions = dispatchType === 'Medical'
        ? Object.keys(EMS_PROTOCOLS[protocol] || {})
        : Object.keys(FIRE_PROTOCOLS);

    const subCallTypeOptions = dispatchType === 'Medical'
        ? (EMS_PROTOCOLS[protocol]?.[mainCallType]) || []
        : (FIRE_PROTOCOLS[mainCallType]) || [];

    const generateWarbleTone = useCallback(async () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const audioContext = audioContextRef.current;
        
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'sine'; // Use a sine wave for a cleaner tone
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        const startTime = audioContext.currentTime;
        const duration = 1.7; // Set duration to 1.7 second
        const endTime = startTime + duration;

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.05);

        oscillator.start(startTime);

        // Generate the warble effect by alternating frequencies
        const warbleFreq1 = 1100;
        const warbleFreq2 = 450;
        const warbleInterval = 0.35; // Slower switch for a less frantic warble
        for (let i = startTime; i < endTime; i += warbleInterval) {
            oscillator.frequency.setValueAtTime(warbleFreq1, i);
            if (i + warbleInterval / 2 < endTime) {
               oscillator.frequency.setValueAtTime(warbleFreq2, i + warbleInterval / 2);
            }
        }
        
        gainNode.gain.setValueAtTime(0.5, endTime - 0.05);
        gainNode.gain.linearRampToValueAtTime(0, endTime);

        oscillator.stop(endTime);

        return new Promise(resolve => setTimeout(resolve, duration * 1000));
    }, []);

    const handleDispatch = async () => {
        if (selectedUnits.length === 0) {
            alert('Please select responding units.');
            return;
        }

        setIsLoading(true);

        try {
            // Add a 2-second delay between button press and the alert tone
            await new Promise(resolve => setTimeout(resolve, 2000));

            if (useAlertTone) {
                await generateWarbleTone();
            }

            const callType = `${mainCallType}${subCallType ? ` - ${subCallType}` : ''}`;
            const unitsText = selectedUnits.join(', ');
            let dispatchText = `This call is for ${unitsText}, ${callType}. Your maps are ${mapPages}, phantom ${phantomPage}`;
            if (crossStreets) {
                dispatchText += `, ${crossStreets}`;
            }
            if (holdForPD) {
              dispatchText += ". Hold short for PD.";
            }
            
            if (!process.env.API_KEY) {
              throw new Error("API_KEY environment variable not set");
            }
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: dispatchText }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { 
                          prebuiltVoiceConfig: { voiceName: 'Kore' },
                        },
                    },
                },
            });

            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

            if (base64Audio) {
                if (!audioContextRef.current) {
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                }
                const audioContext = audioContextRef.current;
                if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                }
                
                const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.playbackRate.value = speechRate; // Control speed on the client-side
                
                source.connect(audioContext.destination);
                source.start();
            } else {
                 console.warn("API call succeeded, but no audio data was returned.", response);
                 alert("Dispatch audio could not be generated. The request may have been blocked for safety reasons or another issue occurred.");
            }
        } catch (error) {
            console.error("Error generating speech:", error);
            alert("Failed to generate dispatch audio. Check console for details.");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 text-center">
                    <h1 className="text-4xl font-extrabold text-white tracking-tight">Fire Dispatch Communicator</h1>
                    <p className="mt-2 text-lg text-gray-400">Henderson Fire Department Dispatch System</p>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Call & Unit Selection */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card title="Call Details">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="dispatchType" className="block text-sm font-medium mb-1">Dispatch Type</label>
                                    <Select id="dispatchType" value={dispatchType} onChange={handleDispatchTypeChange}>
                                        <option value="Medical">Medical</option>
                                        <option value="Fire">Fire</option>
                                    </Select>
                                </div>
                                <div>
                                    <label htmlFor="protocol" className="block text-sm font-medium mb-1">Protocol</label>
                                    <Select id="protocol" value={protocol} onChange={handleProtocolChange} disabled={dispatchType === 'Fire'}>
                                        {Object.keys(EMS_PROTOCOLS).map(p => <option key={p} value={p}>{p}</option>)}
                                    </Select>
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="mainCallType" className="block text-sm font-medium mb-1">Call Type</label>
                                    <Select id="mainCallType" value={mainCallType} onChange={handleMainCallTypeChange}>
                                        {mainCallTypeOptions.map(call => <option key={call} value={call}>{call}</option>)}
                                    </Select>
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="subCallType" className="block text-sm font-medium mb-1">Subcategory</label>
                                    <Select id="subCallType" value={subCallType} onChange={(e) => setSubCallType(e.target.value)} disabled={subCallTypeOptions.length === 0}>
                                         {subCallTypeOptions.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                                    </Select>
                                </div>
                            </div>
                        </Card>

                        <Card title="Responding Units">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                {APPARATUS_ROSTER.map(unit => (
                                    <div key={unit} 
                                        onClick={() => handleUnitSelection(unit)}
                                        className={`p-2 text-center rounded-md cursor-pointer transition-all duration-200 text-sm font-semibold ${selectedUnits.includes(unit) ? 'bg-cyan-600 text-white shadow-md' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                        {unit}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Right Column: Dispatch Control */}
                    <div className="space-y-8">
                        <Card title="Location & Map Details">
                          <div className="space-y-4">
                              <div>
                                  <label htmlFor="mapPages" className="block text-sm font-medium mb-1">Map Pages</label>
                                  <Input id="mapPages" type="text" value={mapPages} onChange={(e) => setMapPages(e.target.value)} placeholder="e.g., 21, 35" />
                              </div>
                              <div>
                                  <label htmlFor="phantomPage" className="block text-sm font-medium mb-1">Phantom Page</label>
                                  <Input id="phantomPage" type="text" value={phantomPage} onChange={(e) => setPhantomPage(e.target.value)} placeholder="e.g., 44" />
                              </div>
                              <div>
                                  <label htmlFor="crossStreets" className="block text-sm font-medium mb-1">Cross Streets / Location</label>
                                  <Input id="crossStreets" type="text" value={crossStreets} onChange={(e) => setCrossStreets(e.target.value)} placeholder="e.g., Arroyo Grande & American Pacific" />
                              </div>
                          </div>
                        </Card>
                        
                        <Card title="Dispatch Control">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="useAlertTone" className="font-medium">Use Alert Tone</label>
                                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                        <input type="checkbox" id="useAlertTone" checked={useAlertTone} onChange={(e) => setUseAlertTone(e.target.checked)} className="absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:bg-cyan-500 transition-all duration-300"/>
                                        <label htmlFor="useAlertTone" className="block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer"></label>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <label htmlFor="holdForPD" className="font-medium">"Hold short for PD"</label>
                                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                         <input type="checkbox" id="holdForPD" checked={holdForPD} onChange={(e) => setHoldForPD(e.target.checked)} className="absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:bg-cyan-500 transition-all duration-300"/>
                                        <label htmlFor="holdForPD" className="block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer"></label>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="speechRate" className="block text-sm font-medium mb-1">Speech Rate: {speechRate.toFixed(1)}x</label>
                                    <input type="range" id="speechRate" min="0.5" max="2.0" step="0.1" value={speechRate} onChange={(e) => setSpeechRate(parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                                </div>
                                <Button onClick={handleDispatch} disabled={isLoading}>
                                    {isLoading ? 'Dispatching...' : 'Dispatch Call'}
                                </Button>
                            </div>
                        </Card>

                        {/* This is a placeholder for custom prompts feature */}
                        <Card title="Custom Prompts (Future)">
                           <p className="text-gray-400 text-sm">Record and manage custom voice prompts for units or locations.</p>
                           <Button variant="secondary" className="mt-4" disabled>Record New Prompt</Button>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);