'use client';

import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../lib/firebase';

interface SensorData {
  temperature: number;
  humidity: number;
  pressure: number;
  iaq: number;
  timestamp: number;
}

function iaqColor(iaq: number): string {
  if (iaq >= 400) return '#ef4444';
  if (iaq >= 300) return '#ea580c';
  if (iaq >= 200) return '#ca8a04';
  if (iaq >= 100) return '#65a30d';
  return '#10b981';
}

const IAQ_LEGEND = [
  { range: '0-100', description: '良好 - 空気がきれいです', color: '#10b981' },
  { range: '100-200', description: '普通 - 許容範囲内です', color: '#65a30d' },
  { range: '200-300', description: '注意 - 敏感な人は注意', color: '#ca8a04' },
  { range: '300-400', description: '悪い - 換気を推奨', color: '#ea580c' },
  { range: '400以上', description: '危険 - 換気が必要', color: '#ef4444' },
] as const;

export default function SensorStatus({ roomName }: { roomName: string }) {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);

  useEffect(() => {
    const sensorRef = ref(database, `room/${roomName}/sensor`);
    const unsubscribe = onValue(sensorRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSensorData(data);
      }
    });
    return () => unsubscribe();
  }, [roomName]);

  const formatTime = (ts: number | null) => {
    if (!ts) return '';
    return new Date(ts).toLocaleString();
  };

  return (
    <div className="dm-card">
      {sensorData ? (
        <>
          <div className="dm-row">
            <span className="dm-rowLabel">🌡️ 温度:</span>
            <span className="dm-rowValue">{sensorData.temperature.toFixed(1)}℃</span>
          </div>

          <div className="dm-row">
            <span className="dm-rowLabel">💧 湿度:</span>
            <span className="dm-rowValue">{sensorData.humidity.toFixed(1)}%</span>
          </div>

          <div className="dm-row">
            <span className="dm-rowLabel">🌊 気圧:</span>
            <span className="dm-rowValue">{sensorData.pressure.toFixed(1)}hPa</span>
          </div>

          <div className="dm-row">
            <span className="dm-rowLabel">🌬️ IAQ:</span>
            <span
              className="dm-rowValue dm-iaqValue"
              style={{ color: iaqColor(sensorData.iaq) }}
            >
              {sensorData.iaq.toFixed(0)}
            </span>
          </div>

          <div className="dm-legend">
            <p className="dm-legendTitle">IAQ指標の目安</p>
            {IAQ_LEGEND.map((row) => (
              <div key={row.range} className="dm-legendRow">
                <span
                  className="dm-legendDot"
                  style={{ backgroundColor: row.color }}
                />
                <span className="dm-legendText">
                  {row.range}: {row.description}
                </span>
              </div>
            ))}
          </div>

          <p className="dm-ts dm-ts--gap">
            Last updated: {formatTime(sensorData.timestamp)}
          </p>
        </>
      ) : (
        <p className="dm-loading">読み込み中...</p>
      )}
    </div>
  );
}
