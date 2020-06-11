/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useEntityBlockEditor } from '@wordpress/core-data';
import { useEffect, useState } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { useFetchMenuItems } from './use-menu-items';
/**
 * External dependencies
 */
import { groupBy, keyBy, sortBy } from 'lodash';
import { createBlock } from '@wordpress/blocks';
import { flattenBlocks } from './helpers';

export const DRAFT_POST_ID = 'navigation-post';

export function useStubPost( query ) {
	const { receiveEntityRecords } = useDispatch( 'core' );
	const { setMenuItemsToClientIdMapping } = useDispatch(
		'core/edit-navigation'
	);
	const [ hydrated, setHydrated ] = useState( false );
	const menuItems = useFetchMenuItems( query );
	useEffect( () => {
		if ( menuItems === null ) {
			return;
		}
		console.log("Effect! nooooice!")
		const [ innerBlocks, menuItemIdByClientId ] = menuItemsToBlocks(
			menuItems
		);
		setMenuItemsToClientIdMapping( menuItemIdByClientId );
		const navigationBlock = createBlock(
			'core/navigation',
			{},
			innerBlocks
		);
		createStubPost( receiveEntityRecords, navigationBlock ).then( () => {
			setHydrated( true );
		} );
	}, [ menuItems ] );

	return hydrated;
}

function createStubPost( receiveEntityRecords, navigationBlock ) {
	return receiveEntityRecords(
		'root',
		'postType',
		[
			{
				id: DRAFT_POST_ID,
				slug: DRAFT_POST_ID,
				generated_slug: DRAFT_POST_ID,
				status: 'draft',
				type: 'page',
				blocks: [ navigationBlock ],
			},
		],
		null,
		false
	);
}

export default function useNavigationBlockEditor() {
	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'root',
		'postType',
		{ id: DRAFT_POST_ID }
	);

	return [ blocks, onInput, onChange ];
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
	console.log("mapped items to blocks?!")
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
