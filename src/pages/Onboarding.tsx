import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import type { AthleteProfile } from '../store/appStore';
import { SPORTS } from '../data/sports';
import { RadarChart } from '../components/charts/RadarChart';

const STEPS = ['Personal Details', 'Select Sport', 'Your Position', 'Vision Baseline'];

const DOMAIN_LABELS = { dva: 'DVA', cs: 'CS', pa: 'PA', dp: 'DP', at: 'AT' };

export function Onboarding() {
  const { setProfile, setOnboardingComplete, user } = useAppStore();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Partial<AthleteProfile>>({
    trainingFreq: 3,
    secondarySports: [],
  });

  const update = (key: keyof AthleteProfile, value: string | number | boolean | string[]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleComplete = () => {
    setProfile(form as AthleteProfile);
    setOnboardingComplete();
    navigate('/dashboard');
  };

  const selectedSport = SPORTS.find((s) => s.id === form.primarySport);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold">
              SV
            </div>
            <span className="text-white font-bold text-lg">SportVision</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            {step === 0 && `Welcome, ${user?.name?.split(' ')[0] || 'Athlete'}!`}
            {step === 1 && 'Choose Your Sport'}
            {step === 2 && 'Select Your Position'}
            {step === 3 && 'Vision Baseline'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                i <= step ? 'bg-gradient-to-r from-blue-600 to-cyan-500' : 'bg-gray-800'
              }`}
            />
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          {/* Step 0: Personal Details */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1.5 font-medium">Date of Birth</label>
                  <input
                    type="date"
                    value={form.dob || ''}
                    onChange={(e) => update('dob', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1.5 font-medium">Gender</label>
                  <select
                    value={form.gender || ''}
                    onChange={(e) => update('gender', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
                  >
                    <option value="">Select…</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Non-binary</option>
                    <option>Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1.5 font-medium">Dominant Eye</label>
                  <select
                    value={form.dominantEye || ''}
                    onChange={(e) => update('dominantEye', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
                  >
                    <option value="">Select…</option>
                    <option>Left</option>
                    <option>Right</option>
                    <option>Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1.5 font-medium">Skill Level</label>
                  <select
                    value={form.skillLevel || ''}
                    onChange={(e) => update('skillLevel', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
                  >
                    <option value="">Select…</option>
                    <option>Recreational</option>
                    <option>Club / Amateur</option>
                    <option>Semi-Professional</option>
                    <option>Professional</option>
                    <option>Elite / National</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2 font-medium">
                  Training Frequency: <span className="text-blue-400">{form.trainingFreq}x per week</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={form.trainingFreq || 3}
                  onChange={(e) => update('trainingFreq', parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>1x</span><span>4x</span><span>7x</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Sport Selection */}
          {step === 1 && (
            <div>
              <p className="text-gray-400 text-sm mb-5">
                Choose your primary sport. We'll tailor exercises to your specific visual demands.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SPORTS.map((sport) => {
                  const isSelected = form.primarySport === sport.id;
                  const demands = Object.entries(sport.visualDemands).map(([k, v]) => ({
                    label: DOMAIN_LABELS[k as keyof typeof DOMAIN_LABELS],
                    value: v,
                    max: 5,
                  }));
                  return (
                    <button
                      key={sport.id}
                      onClick={() => update('primarySport', sport.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      }`}
                    >
                      <div className="text-3xl mb-2">{sport.icon}</div>
                      <p className="text-white font-semibold text-sm">{sport.name}</p>
                      {isSelected && (
                        <div className="mt-3 flex justify-center">
                          <RadarChart
                            series={[{ data: demands, color: sport.color }]}
                            size={100}
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Position */}
          {step === 2 && (
            <div>
              {selectedSport ? (
                <>
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-3xl">{selectedSport.icon}</span>
                    <div>
                      <p className="text-white font-bold">{selectedSport.name}</p>
                      <p className="text-gray-400 text-sm">Select your primary position</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {selectedSport.positions.map((pos) => (
                      <button
                        key={pos}
                        onClick={() => update('position', pos)}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm font-medium ${
                          form.position === pos
                            ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                            : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600'
                        }`}
                      >
                        {form.position === pos ? '✓ ' : ''}{pos}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-gray-400">Please go back and select a sport first.</p>
              )}
            </div>
          )}

          {/* Step 3: Vision Baseline */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-gray-300 mb-3 font-medium">Do you wear corrective lenses?</label>
                <div className="flex gap-3">
                  {['Yes', 'No'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => update('correctiveLenses', opt === 'Yes')}
                      className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                        form.correctiveLenses === (opt === 'Yes')
                          ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                          : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1.5 font-medium">
                  Any known vision conditions? (optional)
                </label>
                <textarea
                  value={form.knownConditions || ''}
                  onChange={(e) => update('knownConditions', e.target.value)}
                  placeholder="e.g. Astigmatism, myopia, amblyopia…"
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm resize-none"
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <p className="text-blue-300 text-sm font-medium mb-1">📋 Assessment Recommended</p>
                <p className="text-gray-400 text-xs leading-relaxed">
                  After setup, we recommend completing our baseline visual assessment (~10 min) to
                  personalise your training programme.
                </p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 accent-blue-500"
                  required
                />
                <span className="text-gray-400 text-xs leading-relaxed">
                  I consent to my vision training data being used to personalise my programme and track
                  progress. Data is stored locally and never shared without permission.
                </span>
              </label>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 font-medium transition-all text-sm"
              >
                ← Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={
                  (step === 1 && !form.primarySport) ||
                  (step === 2 && !form.position)
                }
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all text-sm"
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-3 rounded-xl transition-all text-sm"
              >
                Complete Setup 🚀
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
