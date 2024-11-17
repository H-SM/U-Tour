import React from 'react'

const Loader = () => {
    return (
        <div className="h-full w-full flex justify-center items-center text-white/80">
            <svg className='w-[10rem]' viewBox="0 0 200 60">
                <rect fill="currentColor" x="0" y="0" width="10" height="60" rx="6">
                    <animate attributeType="CSS"
                        attributeName="height"
                        values="60;20;60;"
                        begin='0s'
                        dur="1s"
                        repeatCount="indefinite" />
                    <animate attributeType="CSS"
                        attributeName="y"
                        begin='0s'
                        values="0;20;0;"
                        dur="1s"
                        repeatCount="indefinite" />
                </rect>
                <rect fill="currentColor" x="20" y="0" width="10" height="60" rx="6">
                    <animate attributeType="CSS"
                        attributeName="height"
                        values="60;20;60"
                        begin='0.2s'
                        dur="1s"
                        repeatCount="indefinite" />
                    <animate attributeType="CSS"
                        attributeName="y"
                        values="0;20;0"
                        begin='0.2s'
                        dur="1s"
                        repeatCount="indefinite" />
                </rect>
                <rect fill="currentColor" x="40" y="0" width="10" height="60" rx="6">
                    <animate attributeType="CSS"
                        attributeName="height"
                        values="60;20;60"
                        begin='0.4s'
                        dur="1s"
                        repeatCount="indefinite" />
                    <animate attributeType="CSS"
                        attributeName="y"
                        values="0;20;0"
                        begin='0.4s'
                        dur="1s"
                        repeatCount="indefinite" />
                </rect>
                <rect fill="currentColor" x="60" y="0" width="10" height="60" rx="6">
                    <animate attributeType="CSS"
                        attributeName="height"
                        values="60;20;60"
                        begin='0.6s'
                        dur="1s"
                        repeatCount="indefinite" />
                    <animate attributeType="CSS"
                        attributeName="y"
                        values="0;20;0"
                        begin='0.6s'
                        dur="1s"
                        repeatCount="indefinite" />
                </rect>
                <rect fill="currentColor" x="80" y="0" width="10" height="60" rx="6">
                    <animate attributeType="CSS"
                        attributeName="height"
                        values="60;20;60"
                        begin='0.8s'
                        dur="1s"
                        repeatCount="indefinite" />
                    <animate attributeType="CSS"
                        attributeName="y"
                        values="0;20;0"
                        begin='0.8s'
                        dur="1s"
                        repeatCount="indefinite" />
                </rect>
                <rect fill="currentColor" x="180" y="0" width="10" height="60" rx="6">
                    <animate attributeType="CSS"
                        attributeName="height"
                        values="60;20;60;"
                        begin='0s'
                        dur="1s"
                        repeatCount="indefinite" />
                    <animate attributeType="CSS"
                        attributeName="y"
                        begin='0s'
                        values="0;20;0;"
                        dur="1s"
                        repeatCount="indefinite" />
                </rect>
                <rect fill="currentColor" x="160" y="0" width="10" height="60" rx="6">
                    <animate attributeType="CSS"
                        attributeName="height"
                        values="60;20;60"
                        begin='0.2s'
                        dur="1s"
                        repeatCount="indefinite" />
                    <animate attributeType="CSS"
                        attributeName="y"
                        values="0;20;0"
                        begin='0.2s'
                        dur="1s"
                        repeatCount="indefinite" />
                </rect>
                <rect fill="currentColor" x="140" y="0" width="10" height="60" rx="6">
                    <animate attributeType="CSS"
                        attributeName="height"
                        values="60;20;60"
                        begin='0.4s'
                        dur="1s"
                        repeatCount="indefinite" />
                    <animate attributeType="CSS"
                        attributeName="y"
                        values="0;20;0"
                        begin='0.4s'
                        dur="1s"
                        repeatCount="indefinite" />
                </rect>
                <rect fill="currentColor" x="120" y="0" width="10" height="60" rx="6">
                    <animate attributeType="CSS"
                        attributeName="height"
                        values="60;20;60"
                        begin='0.6s'
                        dur="1s"
                        repeatCount="indefinite" />
                    <animate attributeType="CSS"
                        attributeName="y"
                        values="0;20;0"
                        begin='0.6s'
                        dur="1s"
                        repeatCount="indefinite" />
                </rect>
                <rect fill="currentColor" x="100" y="0" width="10" height="60" rx="6">
                    <animate attributeType="CSS"
                        attributeName="height"
                        values="60;20;60"
                        begin='0.8s'
                        dur="1s"
                        repeatCount="indefinite" />
                    <animate attributeType="CSS"
                        attributeName="y"
                        values="0;20;0"
                        begin='0.8s'
                        dur="1s"
                        repeatCount="indefinite" />
                </rect>
            </svg>
        </div>
    )
}

export default Loader
