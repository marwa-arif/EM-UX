import React from 'react'

function CopilotFab({ onClick }) {
  return (
    <button
      className="copilot-fab"
      onClick={onClick}
      title="Ask Navigator"
      aria-label="Ask Navigator"
    >
      <img src="assets/icons/Navigator icon.svg" width={20} height={20} alt="" />
    </button>
  )
}

export default CopilotFab
