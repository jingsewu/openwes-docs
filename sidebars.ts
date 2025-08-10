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
                'started/introduction',
                'started/installation',
                'started/quick-start',
            ],
        },
        {
            type: 'category',
            label: 'System Overview',
            collapsible: true,
            collapsed: false,
            items: [
                'concepts/architecture',
                'concepts/features-overview',
                'concepts/workflow',
                'advanced/print',
            ],
        },
        {
            type: 'category',
            label: 'For Warehouse Operators',
            collapsible: true,
            collapsed: true,
            items: [
                'operators/operators-guide',
                'concepts/user-guide',
                'operators/operator-troubleshooting',
            ],
        },
        {
            type: 'category',
            label: 'For WMS Managers',
            collapsible: true,
            collapsed: true,
            items: [
                'managers/managers-guide',
                'advanced/customization',
                'advanced/security',
                'advanced/deployment',
                'advanced/system-administration',
            ],
        },
        {
            type: 'category',
            label: 'For Developers',
            collapsible: true,
            collapsed: true,
            items: [
                'developers/developers-guide',
                'advanced/developer-setup',
                {
                    type: 'category',
                    label: 'API Reference',
                    collapsible: true,
                    collapsed: false,
                    items: [
                        'api/api-client-to-wes',
                        'api/api-wes-to-client',
                        'api/authentication',
                        'api/integration-examples'
                    ],
                },
                'advanced/plugin-development',
                'advanced/integrations',
            ],
        },
    ],
};

export default sidebars;
