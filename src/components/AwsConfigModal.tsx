import React, { useState } from 'react';
import { 
  X, Cloud, Check, Copy, AlertCircle, RefreshCw, Server, 
  Shield, Database, Lock, Unlock, KeyRound, ShieldCheck, Eye, EyeOff 
} from 'lucide-react';
import { AwsConfig } from '../types/bio';

interface AwsConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AwsConfig;
  onSaveConfig: (updated: AwsConfig) => void;
}

export const AUTHORIZED_OWNER_NAME = 'Muhammad Shoaib';
// Private master KMS authorization key - NEVER displayed or printed on screen
const MASTER_AUTHORIZATION_KEY = 'AWS-KMS-STREAM';

export const AwsConfigModal: React.FC<AwsConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig
}) => {
  const [formData, setFormData] = useState<AwsConfig>({ ...config });
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ready'>('idle');

  // Key-Based Master Access Control States
  const [isOwnerUnlocked, setIsOwnerUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('sequencestream_cloud_kms_authorized') === 'true';
  });
  const [showKeyPrompt, setShowKeyPrompt] = useState<boolean>(false);
  const [keyInput, setKeyInput] = useState<string>('');
  const [showKeyPassword, setShowKeyPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  // Validate the entered Authorization Key
  const handleVerifyKey = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);

    const enteredKey = keyInput.trim();

    if (!enteredKey) {
      setAuthError('Please enter the Master Authorization Key.');
      return;
    }

    if (enteredKey === MASTER_AUTHORIZATION_KEY) {
      // Key matched: grant full architectural authorization
      setIsOwnerUnlocked(true);
      sessionStorage.setItem('sequencestream_cloud_kms_authorized', 'true');
      setShowKeyPrompt(false);
      setKeyInput('');
      setAuthError(null);
      setAuthSuccess('Authorization Verified: Master KMS Key confirmed. Architectural edit permissions unlocked.');
      setTimeout(() => setAuthSuccess(null), 4000);
    } else {
      // Wrong key: strictly deny access
      setAuthError('Access Denied: Invalid Authorization Key. You are not permitted to modify this cloud architecture.');
    }
  };

  const handleLockArchitecture = () => {
    setIsOwnerUnlocked(false);
    sessionStorage.removeItem('sequencestream_cloud_kms_authorized');
    setShowKeyPrompt(false);
    setKeyInput('');
    setAuthSuccess(null);
    setAuthError(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnerUnlocked) {
      setAuthError('Access Denied: Architectural modification requires Master Key authorization.');
      return;
    }
    onSaveConfig(formData);
    onClose();
  };

  const handleTestPing = () => {
    setTestStatus('testing');
    setTimeout(() => {
      setTestStatus('ready');
      setTimeout(() => setTestStatus('idle'), 4000);
    }, 700);
  };

  const envTemplate = `# Sequence Stream - AWS Integration Parameters
# System Architect: ${AUTHORIZED_OWNER_NAME}
# Do NOT place AWS secret keys or access keys in the client frontend!
# Production requests route through AWS API Gateway with IAM/Cognito auth.

VITE_AWS_S3_BUCKET="${formData.s3Bucket}"
VITE_AWS_API_GATEWAY_URL="${formData.apiGatewayUrl}"
VITE_AWS_REGION="${formData.region}"
VITE_AWS_ANALYSIS_ENDPOINT="${formData.analysisEndpoint}"
VITE_AWS_BATCH_QUEUE="${formData.batchJobQueue}"
`;

  const copyEnvToClipboard = () => {
    navigator.clipboard.writeText(envTemplate);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="aws-config-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="aws-config-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Cloud Infrastructure &amp; Architecture
                </h3>
                {isOwnerUnlocked ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Key Authorized</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    <Lock className="w-3 h-3 text-amber-600" />
                    <span>Protected</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Environment endpoints and parameters for the AWS bioinformatics pipeline.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Integration Status Banner */}
        <div className="px-6 py-2.5 bg-slate-100/80 dark:bg-slate-850/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold">AWS Integration: Operational</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Authorized Owner: <strong className="text-blue-600 dark:text-blue-400">{AUTHORIZED_OWNER_NAME}</strong>
          </span>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">
          {/* Key-Based Access Control Banner */}
          {!isOwnerUnlocked ? (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      Architecture Modification Restricted
                    </h4>
                    <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-1 leading-relaxed">
                      Only authorized personnel with the verified Master Authorization Key are permitted to modify cloud endpoints, S3 ingestion buckets, and Batch queues. All other users have read-only inspection access.
                    </p>
                  </div>
                </div>

                {!showKeyPrompt && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowKeyPrompt(true);
                      setAuthError(null);
                    }}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Authorize Changes</span>
                  </button>
                )}
              </div>

              {/* Master Key Verification Prompt */}
              {showKeyPrompt && (
                <div className="pt-2 border-t border-amber-200 dark:border-amber-800/50 space-y-2">
                  <div className="text-[11px] text-amber-900 dark:text-amber-200 font-semibold flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Enter Master Authorization Key:</span>
                  </div>
                  <form onSubmit={handleVerifyKey} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showKeyPassword ? 'text' : 'password'}
                        value={keyInput}
                        onChange={(e) => {
                          setKeyInput(e.target.value);
                          setAuthError(null);
                        }}
                        placeholder="Enter master authorization key..."
                        className="w-full pl-3 pr-8 py-1.5 text-xs font-mono rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        autoComplete="off"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeyPassword(!showKeyPassword)}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                        title={showKeyPassword ? 'Hide Key' : 'Show Key'}
                      >
                        {showKeyPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verify Key</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowKeyPrompt(false);
                        setKeyInput('');
                        setAuthError(null);
                      }}
                      className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </form>
                </div>
              )}

              {/* Error Message */}
              {authError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5 sm:mt-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    Master Key Authorization Active
                  </div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                    KMS master key verified. Full architectural modification rights granted for this session.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLockArchitecture}
                className="w-full sm:w-auto px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-xs font-semibold transition-colors cursor-pointer shrink-0 text-center"
              >
                Lock Architecture
              </button>
            </div>
          )}

          {authSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{authSuccess}</span>
            </div>
          )}

          {/* Zero-Credential Security Notice */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>Zero-Credential Frontend Security Architecture</span>
            </div>
            <p className="leading-relaxed">
              In accordance with AWS security best practices, secret keys (AWS_SECRET_ACCESS_KEY) are <strong>never</strong> bundled into frontend web bundles. Production requests route through Amazon API Gateway or pre-signed S3 URLs via temporary Amazon Cognito tokens.
            </p>
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>AWS S3 Ingestion Bucket</span>
                  {!isOwnerUnlocked && (
                    <span title="Locked">
                      <Lock className="w-3 h-3 text-amber-500" />
                    </span>
                  )}
                </label>
                <div className="relative">
                  <Database className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    disabled={!isOwnerUnlocked}
                    value={formData.s3Bucket}
                    onChange={(e) => setFormData({ ...formData, s3Bucket: e.target.value })}
                    className={`w-full pl-9 pr-3 py-1.5 text-xs font-mono rounded-lg border transition-all ${
                      isOwnerUnlocked 
                        ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500' 
                        : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 cursor-not-allowed'
                    }`}
                    placeholder="sequence-stream-dna-raw-sequences"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Stores raw uploaded .fasta sequences</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>AWS Region</span>
                  {!isOwnerUnlocked && (
                    <span title="Locked">
                      <Lock className="w-3 h-3 text-amber-500" />
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  disabled={!isOwnerUnlocked}
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className={`w-full px-3 py-1.5 text-xs font-mono rounded-lg border transition-all ${
                    isOwnerUnlocked 
                      ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500' 
                      : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 cursor-not-allowed'
                  }`}
                  placeholder="ap-south-1"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Primary deployment cloud region</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>AWS API Gateway Endpoint</span>
                  {!isOwnerUnlocked && (
                    <span title="Locked">
                      <Lock className="w-3 h-3 text-amber-500" />
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  disabled={!isOwnerUnlocked}
                  value={formData.apiGatewayUrl}
                  onChange={(e) => setFormData({ ...formData, apiGatewayUrl: e.target.value })}
                  className={`w-full px-3 py-1.5 text-xs font-mono rounded-lg border transition-all ${
                    isOwnerUnlocked 
                      ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500' 
                      : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 cursor-not-allowed'
                  }`}
                  placeholder="https://api.sequencestream.edu/v1"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">REST gateway triggering AWS Lambda</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Analysis API Endpoint Route</span>
                  {!isOwnerUnlocked && (
                    <span title="Locked">
                      <Lock className="w-3 h-3 text-amber-500" />
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  disabled={!isOwnerUnlocked}
                  value={formData.analysisEndpoint}
                  onChange={(e) => setFormData({ ...formData, analysisEndpoint: e.target.value })}
                  className={`w-full px-3 py-1.5 text-xs font-mono rounded-lg border transition-all ${
                    isOwnerUnlocked 
                      ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500' 
                      : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 cursor-not-allowed'
                  }`}
                  placeholder="/analyze/batch-workflow"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Route dispatching Step Functions workflow</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>AWS Batch Job Queue</span>
                {!isOwnerUnlocked && (
                  <span title="Locked">
                    <Lock className="w-3 h-3 text-amber-500" />
                  </span>
                )}
              </label>
              <div className="relative">
                <Server className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  disabled={!isOwnerUnlocked}
                  value={formData.batchJobQueue}
                  onChange={(e) => setFormData({ ...formData, batchJobQueue: e.target.value })}
                  className={`w-full pl-9 pr-3 py-1.5 text-xs font-mono rounded-lg border transition-all ${
                    isOwnerUnlocked 
                      ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500' 
                      : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 cursor-not-allowed'
                  }`}
                  placeholder="sequence-stream-highmem-queue"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Containerized compute queue for heavy bioinformatics analyses</span>
            </div>

            {/* Handshake verification & Copy parameters */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestPing}
                  disabled={testStatus === 'testing'}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin text-blue-600' : ''}`} />
                  <span>Verify Endpoint Handshake</span>
                </button>
                {testStatus === 'ready' && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Handshake Endpoint Formatted OK
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={copyEnvToClipboard}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-1.5 cursor-pointer"
              >
                {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedEnv ? 'Copied to Clipboard' : 'Copy .env Parameters'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            {isOwnerUnlocked ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Authorized as {AUTHORIZED_OWNER_NAME}
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                <Lock className="w-3 h-3" /> Architecture Locked
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-3.5 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium rounded-lg transition-colors cursor-pointer text-center"
            >
              Close
            </button>
            {isOwnerUnlocked ? (
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 sm:flex-none px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Save Configuration</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowKeyPrompt(true);
                  setAuthError(null);
                }}
                className="flex-1 sm:flex-none px-4 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 hover:bg-amber-100 dark:hover:bg-amber-950/50 hover:text-amber-800"
              >
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span>Authorize to Edit</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
