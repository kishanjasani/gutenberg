/**
 * External dependencies
 */
import { keyBy, groupBy, sortBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState, useRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { flattenBlocks } from './helpers';

export default function useCreateNavigationBlock() {
	const [ blocks, setBlocks ] = useState( [] );
	const menuItemsRef = useRef( {} );
	const { setMenuItemsToClientIdMapping } = useDispatch(
		'core/edit-navigation'
	);
	return ( menuItems ) => {
		const [ innerBlocks, clientIdToMenuItemMapping ] = menuItemsToBlocks(
			menuItems,
			[],
			{}
			// blocks[ 0 ]?.innerBlocks,
			// menuItemsRef.current
		);

		const navigationBlock = blocks[ 0 ]
			? { ...blocks[ 0 ], innerBlocks }
			: createBlock( 'core/navigation', {}, innerBlocks );

		setBlocks( [ navigationBlock ] );
		menuItemsRef.current = clientIdToMenuItemMapping;
		setTimeout( () =>
			setMenuItemsToClientIdMapping( clientIdToMenuItemMapping )
		);
		return navigationBlock;
	};
}

const menuItemsToBlocks = (
	menuItems,
	prevBlocks = [],
	prevClientIdToMenuItemMapping = {}
) => {
	const blocksByMenuId = mapBlocksByMenuId(
		prevBlocks,
		prevClientIdToMenuItemMapping
	);

	const itemsByParentID = groupBy( menuItems, 'parent' );
	const menuItemIdByClientId = {};
	const menuItemsToTreeOfBlocks = ( items ) => {
		const innerBlocks = [];
		if ( ! items ) {
			return;
		}

		const sortedItems = sortBy( items, 'menu_order' );
		for ( const item of sortedItems ) {
			let menuItemInnerBlocks = [];
			if ( itemsByParentID[ item.id ]?.length ) {
				menuItemInnerBlocks = menuItemsToTreeOfBlocks(
					itemsByParentID[ item.id ]
				);
			}
			const linkBlock = menuItemToLinkBlock(
				item,
				menuItemInnerBlocks,
				blocksByMenuId[ item.id ]
			);
			menuItemIdByClientId[ linkBlock.clientId ] = item.id;
			innerBlocks.push( linkBlock );
		}
		return innerBlocks;
	};

	// menuItemsToTreeOfLinkBlocks takes an array of top-level menu items and recursively creates all their innerBlocks
	const blocks = menuItemsToTreeOfBlocks( itemsByParentID[ 0 ] || [] );
	return [ blocks, menuItemIdByClientId ];
};

function menuItemToLinkBlock(
	menuItem,
	innerBlocks = [],
	existingBlock = null
) {
	const attributes = {
		label: menuItem.title.rendered,
		url: menuItem.url,
	};

	if ( existingBlock ) {
		return {
			...existingBlock,
			attributes,
			innerBlocks,
		};
	}
	return createBlock( 'core/navigation-link', attributes, innerBlocks );
}

const mapBlocksByMenuId = ( blocks, menuItemsByClientId ) => {
	const blocksByClientId = keyBy( flattenBlocks( blocks ), 'clientId' );
	const blocksByMenuId = {};
	for ( const clientId in menuItemsByClientId ) {
		const menuItem = menuItemsByClientId[ clientId ];
		blocksByMenuId[ menuItem.id ] = blocksByClientId[ clientId ];
	}
	return blocksByMenuId;
};
