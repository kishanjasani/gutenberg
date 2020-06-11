/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useMemo, useEffect, useCallback } from '@wordpress/element';
import { useEntityBlockEditor } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { useFetchMenuItems, useSaveMenuItems } from './use-menu-items';
import createNavigationBlock from './create-navigation-block';
import useCreateMissingMenuItems from './use-create-missing-menu-items';

export const DRAFT_POST_ID = 'navigation-post';

export default function useNavigationBlockEditor( navigationId ) {
	const query = useMemo( () => ( { menus: navigationId, per_page: -1 } ), [
		navigationId,
	] );
	const { createMissingMenuItems, onCreated } = useCreateMissingMenuItems(
		query
	);
	const saveMenuItems = useSaveMenuItems( query );
	const save = () => onCreated( () => saveMenuItems( blocks ) );

	useInitializeStubPost( query );
	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'root',
		'postType',
		{ id: DRAFT_POST_ID }
	);
	const onProviderChange = useCallback(
		( updatedBlocks ) => {
			onChange( updatedBlocks );
			createMissingMenuItems( blocks, updatedBlocks );
		},
		[ blocks, onChange, createMissingMenuItems ]
	);

	return [ blocks, onInput, onProviderChange, save ];
}

export function useInitializeStubPost( query ) {
	const menuItems = useFetchMenuItems( query );
	const { receiveEntityRecords } = useDispatch( 'core' );
	const { setMenuItemsToClientIdMapping } = useDispatch(
		'core/edit-navigation'
	);
	useEffect( () => {
		if ( menuItems === null ) {
			return;
		}
		const [ navigationBlock, menuItemIdByClientId ] = createNavigationBlock(
			menuItems
		);
		setMenuItemsToClientIdMapping( menuItemIdByClientId );

		const post = createStubPost( navigationBlock );
		receiveEntityRecords( 'root', 'postType', post, null, false );
	}, [ menuItems === null, query ] );
}

function createStubPost( navigationBlock ) {
	return {
		id: DRAFT_POST_ID,
		slug: DRAFT_POST_ID,
		generated_slug: DRAFT_POST_ID,
		status: 'draft',
		type: 'page',
		blocks: [ navigationBlock ],
	};
}
