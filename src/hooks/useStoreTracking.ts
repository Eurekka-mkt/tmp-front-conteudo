import { useCallback } from 'react';
import { useApi } from './useApi';
import { getBrowserId } from '../utils/tracking';

const CREATE_TRACKING_STORE_MUTATION = `
  mutation CreateTrackingStore($trackingStore: TrackingStoreInput) {
    createTrackingStore(trackingStore: $trackingStore)
  }
`;

interface TrackingMetadata {
  [key: string]: any;
}

export function useStoreTracking() {
  const { query } = useApi();

  const track = useCallback(async (
    description: string,
    metadata?: TrackingMetadata,
    email?: string
  ) => {
    try {
      const browserId = getBrowserId();
      
      await query(CREATE_TRACKING_STORE_MUTATION, {
        trackingStore: {
          browserId,
          email: email || undefined,
          description,
          metadata: metadata || {}
        }
      }, false);
    } catch (error) {
      // Silently fail tracking to not disrupt user experience
      console.warn('Tracking failed:', error);
    }
  }, [query]);

  return { track };
}