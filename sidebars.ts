/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.
 */

// @ts-check
import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/** @type {SidebarsConfig} */
const sidebars: SidebarsConfig = {
    docs: [
        {
            type: 'category',
            label: 'Getting Started',
            collapsible: false,
            items: [
                'started/introduction', // Corresponds to docs/introduction.md
                'started/installation', // Corresponds to docs/installation.md
                'started/quick-start', // Corresponds to docs/quick-start.md
            ],
        },
        {
            type: 'category',
            label: 'Core Concepts',
            collapsible: true,
            collapsed: false,
            items: [
                'concepts/architecture', // Corresponds to docs/architecture.md
                'concepts/user-guide', // Corresponds to docs/modules.md
                'concepts/workflow', // Corresponds to docs/workflow.md
            ],
        },
        {
            type: 'category',
            label: 'API Reference',
            collapsible: true,
            collapsed: true,
            items: [
                'api/api-client-to-wes',
                'api/api-wes-to-client',
                'api/authentication'
            ],
        },
        {
            type: 'category',
            label: 'Advanced Topics',
            collapsible: true,
            collapsed: true,
            items: [
                'advanced/customization',
                'advanced/integrations',
                'advanced/print',
                'advanced/security',
            ],
        },
        {
            type: 'doc',
            id: 'faq', // Corresponds to docs/faq.md
        },
    ],
};

export default sidebars;
