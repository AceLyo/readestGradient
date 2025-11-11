import React, { useEffect, useState } from 'react';
import { TbWaveSine } from 'react-icons/tb';

import { useEnv } from '@/context/EnvContext';
import { useReaderStore } from '@/store/readerStore';
import { useTranslation } from '@/hooks/useTranslation';
import { saveViewSettings } from '@/helpers/settings';
import Button from '@/components/Button';

const GradientToggler = ({ bookKey }: { bookKey: string }) => {
  const _ = useTranslation();
  const { envConfig, appService } = useEnv();
  const { getViewSettings, setViewSettings, setHoveredBookKey } = useReaderStore();

  const viewSettings = getViewSettings(bookKey)!;
  const [gradientReadingEnabled, setGradientReadingEnabled] = useState(
    viewSettings.gradientReadingEnabled!,
  );

  useEffect(() => {
    if (gradientReadingEnabled === viewSettings.gradientReadingEnabled) return;
    if (appService?.isMobile) {
      setHoveredBookKey('');
    }
    saveViewSettings(envConfig, bookKey, 'gradientReadingEnabled', gradientReadingEnabled, true);
    viewSettings.gradientReadingEnabled = gradientReadingEnabled;
    setViewSettings(bookKey, { ...viewSettings });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradientReadingEnabled]);

  useEffect(() => {
    setGradientReadingEnabled(viewSettings.gradientReadingEnabled);
  }, [viewSettings.gradientReadingEnabled]);

  return (
    <Button
      icon={
        <TbWaveSine
          className={gradientReadingEnabled ? 'text-blue-500' : 'text-base-content'}
        />
      }
      onClick={() => setGradientReadingEnabled(!gradientReadingEnabled)}
      label={_('Gradient Reading')}
    />
  );
};

export default GradientToggler;

