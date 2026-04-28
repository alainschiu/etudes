export const APP_VERSION='0.95.5';
export const SCHEMA_VERSION=8;

export const STAGES=[{key:'queued',label:'Queued',pct:0},{key:'learning',label:'Learning',pct:30},{key:'polishing',label:'Polishing',pct:70},{key:'maintenance',label:'Maintenance',pct:95},{key:'retired',label:'Retired',pct:100}];
export const TYPES=['tech','piece','play','study'];
export const SECTION_CONFIG={tech:{label:'Technique',roman:'I'},piece:{label:'Pieces',roman:'II'},play:{label:'Play',roman:'III'},study:{label:'Study',roman:'IV'}};

export const DEFAULT_SESSIONS=[
  {id:'s-tech',type:'tech',itemIds:[],target:null,itemTargets:{},isWarmup:false},
  {id:'s-piece',type:'piece',itemIds:[],target:null,itemTargets:{},isWarmup:false},
  {id:'s-play',type:'play',itemIds:[],target:null,itemTargets:{},isWarmup:false},
  {id:'s-study',type:'study',itemIds:[],target:null,itemTargets:{},isWarmup:false},
];

export const ROLLOVER_KEY='etudes-lastActiveDate';
export const WEEK_ROLLOVER_KEY='etudes-lastWeekStart';
export const MONTH_ROLLOVER_KEY='etudes-lastMonthKey';
