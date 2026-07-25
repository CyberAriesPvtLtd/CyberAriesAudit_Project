import React, { useState, useEffect, useRef } from 'react';
import { useClient } from '../context/ClientContext';
import { HelpCircle, Send, Paperclip, CheckCircle, Clock, FileText, AlertCircle, X } from 'lucide-react';

export default function Findings() {
  const { findings, addReplyToFinding, currentAudit, switchAudit, assignedAudits } = useClient();
  const [selectedFindingId, setSelectedFindingId] = useState('');
  const [replyText, setReplyText] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Set default active finding or reset on findings list change
  useEffect(() => {
    if (findings.length > 0) {
      if (!findings.some(f => f.id === selectedFindingId)) {
        setSelectedFindingId(findings[0].id);
      }
    } else {
      setSelectedFindingId('');
    }
  }, [findings, selectedFindingId]);

  const activeFinding = findings.find(f => f.id === selectedFindingId);

  const handleSubmitReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() && !attachedFile) return;

    addReplyToFinding(selectedFindingId, replyText, attachedFile ? attachedFile.name : null);
    setReplyText('');
    setAttachedFile(null);
  };

  const handleFileAttach = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">Auditor Questions & Findings</h1>
          <p className="page-subtitle">Clarify controls deficiencies, reply to comments, and submit requested documents.</p>
        </div>
      </div>

      {/* Audit Switcher Row */}
      <div className="dashboard-section-card" style={{ padding: '16px 20px', marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>
          Current Audit
        </span>
        <div style={{ position: 'relative', width: '320px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '14px' }}>
            {currentAudit.includes('SOC 2') ? '🔑' : currentAudit.includes('SEBI') ? '🛡️' : currentAudit.includes('ISO 27001') ? '📁' : '⚡'}
          </span>
          <select
            className="table-filter-select"
            style={{ 
              padding: '10px 24px 10px 34px', 
              fontSize: '13px', 
              fontWeight: '600', 
              width: '100%', 
              cursor: 'pointer', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-color)',
              backgroundColor: '#FFFFFF',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-sm)'
            }}
            value={currentAudit}
            onChange={(e) => switchAudit(e.target.value)}
          >
            {assignedAudits.map(audit => (
              <option key={audit} value={audit}>{audit}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Two-Column Chat Grid */}
      <div className="findings-main-grid">
        
        {/* Left Side: Findings List */}
        <div className="dashboard-section-card" style={{ padding: '16px', marginBottom: 0 }}>
          <h3 className="section-title" style={{ fontSize: '14px', marginBottom: '12px', paddingLeft: '4px' }}>Reported Items</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {findings.map(finding => {
              const isActive = finding.id === selectedFindingId;
              return (
                <button
                  key={finding.id}
                  onClick={() => {
                    setSelectedFindingId(finding.id);
                    setReplyText('');
                    setAttachedFile(null);
                  }}
                  style={{
                    display: 'block',
                    textAlign: 'left',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: isActive ? 'rgba(229,57,53,0.2)' : 'var(--border-color)',
                    backgroundColor: isActive ? 'var(--primary-light)' : '#FFFFFF',
                    color: isActive ? 'var(--primary)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: '700', display: 'block' }}>{finding.id}</span>
                  <span style={{ fontSize: '12.5px', fontWeight: '500', display: 'block', marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {finding.name}
                  </span>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '10.5px', color: isActive ? 'var(--primary)' : 'var(--text-secondary)' }}>
                    {finding.status === 'Resolved' ? (
                      <>
                        <CheckCircle size={10} style={{ color: '#10B981' }} />
                        <span style={{ color: '#137333' }}>Response Submitted</span>
                      </>
                    ) : (
                      <>
                        <Clock size={10} />
                        <span>Awaiting Response</span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Active Chat Box */}
        {activeFinding ? (
          <div className="finding-card" style={{ display: 'flex', flexDirection: 'column', minHeight: '480px' }}>
            {/* Chat Room Header */}
            <div className="finding-card-header">
              <div className="finding-card-title">
                <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{activeFinding.id}</span>
                <span style={{ color: 'var(--text-muted)' }}>|</span>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{activeFinding.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  Auditor: <strong>{activeFinding.auditor}</strong>
                </span>
                
                <span className={`badge ${activeFinding.status === 'Resolved' ? 'badge-completed' : 'badge-pending'}`}>
                  {activeFinding.status === 'Resolved' ? 'Response Submitted' : 'Pending Response'}
                </span>
              </div>
            </div>

            {/* Bubble Messages stream */}
            <div className="finding-chats-box" style={{ flexGrow: 1, maxHeight: '350px', overflowY: 'auto' }}>
              {activeFinding.comments.map((comment, index) => (
                <div 
                  key={index} 
                  className={`chat-bubble ${comment.sender.toLowerCase() === 'auditor' ? 'auditor' : 'client'}`}
                >
                  <span style={{ fontSize: '11px', fontWeight: '700', opacity: 0.8, marginBottom: '2px' }}>
                    {comment.name}
                  </span>
                  <div>{comment.message}</div>
                  
                  {comment.attachment && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '8px',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: comment.sender.toLowerCase() === 'auditor' ? 'var(--bg-main)' : 'rgba(255,255,255,0.15)',
                      fontSize: '12px',
                      fontWeight: '550',
                      border: '1px solid rgba(0,0,0,0.05)'
                    }}>
                      <FileText size={14} />
                      <span>{comment.attachment}</span>
                    </div>
                  )}

                  <span className="chat-time">
                    {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>

            {/* Reply Editor Form */}
            <form onSubmit={handleSubmitReply} className="finding-response-form">
              {attachedFile && (
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  backgroundColor: 'var(--bg-main)', 
                  border: '1px solid var(--border-color)', 
                  padding: '6px 12px', 
                  borderRadius: 'var(--radius-sm)', 
                  fontSize: '12.5px',
                  marginBottom: '10px'
                }}>
                  <FileText size={14} style={{ color: 'var(--primary)' }} />
                  <span>{attachedFile.name}</span>
                  <button 
                    type="button" 
                    onClick={removeAttachment}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <textarea
                className="chat-textarea"
                placeholder="Type your response to the Auditor here..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              ></textarea>

              <div className="chat-actions-row">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleFileAttach}
                />
                <button 
                  type="button" 
                  className="attachment-trigger-btn"
                  onClick={() => fileInputRef.current.click()}
                >
                  <Paperclip size={14} />
                  <span>Attach Evidence File</span>
                </button>
                
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ padding: '8px 20px', fontSize: '13.5px' }}
                  disabled={!replyText.trim() && !attachedFile}
                >
                  <Send size={14} /> Submit Response
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="finding-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '480px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            <AlertCircle size={32} style={{ marginBottom: '12px', color: 'var(--text-muted)' }} />
            <span>Select a reported finding item to reply.</span>
          </div>
        )}

      </div>
    </div>
  );
}
