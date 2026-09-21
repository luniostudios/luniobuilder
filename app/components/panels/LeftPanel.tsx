"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutGrid as Layout, Type, Image, MousePointer, Square, Columns2 as Columns, Grid2x2 as Grid, AlignLeft, Link, Star, Minus, Move, FileText, ChevronRight, ChevronDown, ChevronLeft, Eye, EyeOff, Lock, Unlock, Trash2, Copy, Plus, Layers, Package, Globe, Monitor, Play, Form, List, ListEnd, Laptop, CalendarDays, LayoutIcon, LayoutPanelTop, IdCard, TextInitialIcon, Code2, ChevronsDownUp, Table2, ListTree, Database, ExternalLink, Search, Blocks } from 'lucide-react';
import { DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useBuilderStore } from '../../stores/builderStore';
import { ElementType, BuilderElement, Page } from '../../types/builder';
import { COMPONENT_CATEGORIES, COMPONENT_LABELS, canHaveChildren, getComponentElements } from '../../utils/builderUtils';
import type { CmsCollection, CmsRecord } from '../../types/cms';
import { Button } from '@/components/ui/button';
import { Dialog, DialogDescription, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const COMPONENT_ICONS: Record<string, React.ReactNode> = {
  section: <Layout size={25} />,
  div: <Square size={25} />,
  heading: <Type size={25} />,
  paragraph: <TextInitialIcon size={25} />,
  button: <MousePointer size={25} />,
  image: <Image size={25} />,
  link: <Link size={25} />,
  navbar: <LayoutPanelTop size={25} />,
  hero: <LayoutIcon size={25} />,
  card: <IdCard size={25} />,
  grid: <Grid size={25} />,
  columns: <Columns size={25} />,
  form: <Form size={25} />,
  input: <FileText size={25} />,
  textarea: <AlignLeft size={25} />,
  video: <Play size={25} />,
  divider: <Minus size={25} />,
  spacer: <Move size={25} />,
  icon: <Star size={25} />,
  list: <List size={25} />,
  listItem: <ListEnd size={25} />,
  iframe: <Laptop size={25} />,
  calendar: <CalendarDays size={25} />,
  table: <Table2 size={25} />,
  cmsMap: <ListTree size={25} />,
  custom: <Code2 size={25} />,
};

export const LeftPanel: React.FC = () => {
  const { leftPanelTab, setLeftPanelTab } = useBuilderStore();
  const [isCollapsed, setIsCollapsed] = useState(true);

  const tabs = [
    { id: 'components' as const, label: 'Elements', icon: <Package size={17} /> },
    { id: 'library' as const, label: 'Components', icon: <Blocks size={17} /> },
    { id: 'layers' as const, label: 'Layers', icon: <Layers size={17} /> },
    { id: 'pages' as const, label: 'Pages', icon: <Globe size={17} /> },
    { id: 'cms' as const, label: 'Data Sources', icon: <Database size={17} /> },
  ];

  return (
    <div className={`max-md:hidden flex h-full shrink-0 border-r border-gray-800 bg-[#111114] transition-[width] duration-200 ${isCollapsed ? 'w-13' : 'w-72'}`}>
      <div className="flex w-13 shrink-0 flex-col items-center border-r border-gray-800 bg-[#0d0f12] py-2">
        <div className="flex flex-col items-center gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (!isCollapsed && leftPanelTab === tab.id) {
                  setIsCollapsed(true);
                  return;
                }
                setLeftPanelTab(tab.id);
                setIsCollapsed(false);
              }}
              aria-label={tab.label}
              aria-pressed={leftPanelTab === tab.id && !isCollapsed}
              title={tab.label}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${leftPanelTab === tab.id && !isCollapsed
                ? 'bg-blue-500/15 text-blue-300'
                : 'text-gray-500 hover:bg-gray-800 hover:text-gray-200'
                }`}
            >
              {tab.icon}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed(current => !current)}
          aria-label={isCollapsed ? 'Open left panel' : 'Collapse left panel'}
          title={isCollapsed ? 'Open panel' : 'Collapse panel'}
          className="mt-auto flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-200"
        >
          {isCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
        </button>
      </div>

      <div className={`min-w-0 flex-1 overflow-hidden ${isCollapsed ? 'hidden' : 'flex flex-col'}`}>
        <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
          {leftPanelTab === 'components' && <ComponentsTab />}
          {leftPanelTab === 'library' && <ComponentLibraryTab />}
          {leftPanelTab === 'layers' && <LayersTab />}
          {leftPanelTab === 'pages' && <PagesTab />}
          {leftPanelTab === 'cms' && <CmsTab />}
        </div>
      </div>
    </div>
  );
};

type CmsCollectionWithRecords = CmsCollection & { records: CmsRecord[] };

type DataSourceDefinition = {
  id: string;
  label: string;
  icon: React.ReactNode;
  available: boolean;
  href?: (projectId: string) => string;
};

const DATA_SOURCE_DEFINITIONS: DataSourceDefinition[] = [
  {
    id: 'cms',
    label: 'CMS',
    icon: <Database size={26} />,
    available: true,
    href: projectId => `/dashboard/settings/${projectId}/cms`,
  },
  { id: 'rest-api', label: 'REST API', icon: <Code2 size={26} />, available: false },
  {
    id: 'supabase', label: 'Supabase', icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(0 0 0)">
      <path d="M13.6435 21.6677C13.1325 22.3111 12.0966 21.9586 12.0843 21.137L11.9042 9.12064H19.9841C21.4475 9.12064 22.2637 10.811 21.3537 11.9571L13.6435 21.6677Z" fill="#ffffff" />
      <path d="M13.6435 21.6677C13.1325 22.3111 12.0966 21.9586 12.0843 21.137L11.9042 9.12064H19.9841C21.4475 9.12064 22.2637 10.811 21.3537 11.9571L13.6435 21.6677Z" fill="#ffffff" />
      <path d="M10.3574 2.33232C10.8684 1.68882 11.9044 2.04141 11.9167 2.86299L11.9956 14.8794H4.01686C2.55334 14.8794 1.73711 13.189 2.64717 12.0429L10.3574 2.33232Z" fill="#ffffff" />
    </svg>
    , available: false
  },
  {
    id: 'postgresql', label: 'PostgreSQL', icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(0 0 0)">
      <path d="M16.2385 2C15.4614 2.00578 14.6888 2.11879 13.9426 2.33584L13.8901 2.3525C13.4195 2.26933 12.943 2.22335 12.4651 2.215C11.4835 2.19834 10.6401 2.43667 9.96011 2.83334C9.29011 2.60084 7.90009 2.2 6.43508 2.28C5.41507 2.33584 4.30174 2.64584 3.47673 3.51668C2.65422 4.38752 2.21922 5.73503 2.31089 7.56839C2.33589 8.07421 2.48006 8.89922 2.71922 9.96757C2.95839 11.0359 3.29423 12.2867 3.7134 13.4276C4.13257 14.5693 4.59174 15.5943 5.30926 16.291C5.66757 16.6401 6.16092 16.9335 6.74258 16.9093C7.15093 16.8926 7.52009 16.7135 7.83844 16.4493C7.99344 16.6535 8.15928 16.7426 8.3101 16.8251C8.5001 16.9293 8.6851 17.0001 8.87679 17.0468C9.22095 17.1326 9.81011 17.2476 10.5001 17.1301C10.7351 17.091 10.9826 17.0143 11.2293 16.9051C11.2385 17.1801 11.2493 17.4493 11.2601 17.7218C11.2943 18.5851 11.316 19.3827 11.5751 20.0818C11.6168 20.196 11.731 20.7843 12.181 21.3035C12.631 21.8235 13.5126 22.1477 14.5168 21.9327C15.2252 21.781 16.126 21.5077 16.7244 20.656C17.316 19.8143 17.5827 18.6068 17.6352 16.6485C17.6485 16.5426 17.6644 16.4526 17.681 16.3685L17.8219 16.381H17.8385C18.5944 16.4151 19.4144 16.3076 20.0994 15.9893C20.7061 15.7085 21.1652 15.4243 21.4994 14.9201C21.5827 14.7951 21.6744 14.6443 21.6994 14.3843C21.7244 14.1243 21.5752 13.7176 21.3277 13.5301C20.8319 13.1534 20.5202 13.2968 20.186 13.3659C19.8569 13.4387 19.5214 13.4794 19.1844 13.4876C20.1477 11.8651 20.8386 10.1417 21.2327 8.61672C21.4661 7.71671 21.5969 6.8867 21.6077 6.16088C21.6186 5.43503 21.5594 4.79253 21.1244 4.23669C19.7652 2.5 17.8544 2.02 16.376 2.00333C16.3302 2.0025 16.2844 2.00167 16.2385 2.0025V2ZM16.1994 2.53334C17.5977 2.52 19.3844 2.91251 20.6669 4.55169C20.9552 4.92003 21.0411 5.45837 21.0311 6.12169C21.0202 6.7842 20.8977 7.57755 20.6736 8.44671C20.2385 10.1301 19.4169 12.0926 18.2594 13.8534C18.3003 13.8825 18.3444 13.9065 18.391 13.9251C18.6327 14.0251 19.1835 14.111 20.2827 13.8851C20.5594 13.8268 20.7619 13.7876 20.9719 13.9476C21.0229 13.9909 21.0632 14.0454 21.0897 14.1068C21.1162 14.1682 21.128 14.235 21.1244 14.3018C21.1132 14.4029 21.0758 14.4994 21.0161 14.5818C20.8036 14.901 20.3844 15.2035 19.8469 15.4526C19.371 15.6743 18.6885 15.7901 18.0835 15.7968C17.7802 15.8001 17.5002 15.7768 17.2627 15.7026L17.2477 15.6968C17.156 16.5801 16.9452 18.3243 16.8077 19.1202C16.6977 19.7618 16.5052 20.2718 16.1377 20.6535C15.771 21.0352 15.2518 21.2652 14.5535 21.4152C13.6885 21.601 13.0576 21.401 12.651 21.0585C12.2451 20.7168 12.0593 20.2635 11.9476 19.986C11.871 19.7943 11.831 19.546 11.7926 19.2143C11.7543 18.8827 11.726 18.4768 11.7068 18.0193C11.6813 17.3188 11.6729 16.6177 11.6818 15.9168C11.3205 16.2478 10.8715 16.4676 10.3885 16.5501C9.8143 16.6476 9.30179 16.5518 8.99595 16.4751C8.8452 16.4373 8.69963 16.381 8.5626 16.3076C8.42094 16.2318 8.28594 16.146 8.19594 15.9768C8.14307 15.8799 8.12622 15.7674 8.14844 15.6593C8.1766 15.5497 8.24054 15.4526 8.3301 15.3835C8.4951 15.2493 8.71345 15.1743 9.0426 15.106C9.6418 14.9826 9.85096 14.8985 9.97846 14.7976C10.0868 14.711 10.2093 14.536 10.426 14.2793C10.4249 14.2679 10.4241 14.2565 10.4235 14.2451C10.0357 14.2342 9.65595 14.132 9.31511 13.9468C9.19011 14.0785 8.55179 14.7535 7.77344 15.6901C7.44593 16.0818 7.08427 16.3068 6.70258 16.3226C6.32092 16.3393 5.97592 16.1468 5.68257 15.8626C5.09676 15.2935 4.62924 14.3143 4.22174 13.2076C3.81507 12.1009 3.48423 10.8684 3.24923 9.81841C3.01339 8.7684 2.87422 7.92171 2.85422 7.51339C2.76672 5.77838 3.17256 4.60919 3.8684 3.87168C4.56507 3.13418 5.52007 2.85501 6.45093 2.80167C8.12178 2.70584 9.70845 3.28835 10.0293 3.41335C10.6476 2.99334 11.4443 2.73167 12.4393 2.74834C12.9117 2.75497 13.3817 2.81592 13.8401 2.93001L13.8568 2.92251C14.0586 2.85158 14.2642 2.79204 14.4727 2.74417C15.0387 2.61213 15.6174 2.542 16.1985 2.535L16.1994 2.53334ZM16.326 3.09168H16.2044C15.7269 3.09833 15.2513 3.15193 14.7843 3.25168C15.8227 3.71168 16.6069 4.42002 17.1594 5.12668C17.5431 5.61597 17.8604 6.15401 18.1027 6.7267C18.1944 6.9467 18.256 7.13255 18.291 7.2767C18.3085 7.3492 18.3202 7.41005 18.3244 7.47339C18.326 7.50505 18.3277 7.53755 18.3144 7.59339C18.3144 7.59589 18.3102 7.60171 18.3094 7.60421C18.3344 8.33421 18.1535 8.82922 18.1319 9.52591C18.1152 10.0309 18.2444 10.6242 18.276 11.2717C18.306 11.8801 18.2327 12.5484 17.8377 13.2043C17.871 13.2443 17.901 13.2843 17.9327 13.3243C18.9777 11.6784 19.731 9.85757 20.1327 8.30506C20.3477 7.46921 20.4619 6.7117 20.4719 6.11169C20.4802 5.51169 20.3685 5.07669 20.226 4.89503C19.1077 3.46501 17.5944 3.10084 16.326 3.09084V3.09168ZM12.3343 3.30501C11.3493 3.30751 10.6426 3.60501 10.1068 4.05085C9.5543 4.51169 9.18345 5.14253 8.9401 5.78838C8.65095 6.55504 8.55179 7.2967 8.5126 7.80005L8.52344 7.7934C8.82095 7.62671 9.21179 7.46005 9.63011 7.36339C10.0485 7.26755 10.4993 7.23755 10.9076 7.39589C11.316 7.55421 11.6535 7.92671 11.776 8.49171C12.3626 11.2059 11.5935 12.2151 11.3101 12.9768C11.2027 13.2529 11.1106 13.5347 11.0343 13.8209C11.0701 13.8126 11.106 13.8026 11.1418 13.7993C11.3418 13.7826 11.4985 13.8493 11.5918 13.8893C11.8768 14.0076 12.0726 14.256 12.1785 14.5393C12.206 14.6135 12.226 14.6935 12.2376 14.776C12.2499 14.8098 12.2556 14.8458 12.2543 14.8818C12.2227 15.9199 12.2263 16.9589 12.2651 17.9968C12.2843 18.4451 12.3126 18.8402 12.3485 19.1518C12.3843 19.4627 12.4351 19.6993 12.4676 19.7793C12.5743 20.046 12.7301 20.3952 13.0118 20.6327C13.2935 20.8693 13.6976 21.0277 14.436 20.8693C15.076 20.7318 15.471 20.541 15.7352 20.2668C15.9985 19.9927 16.156 19.611 16.2569 19.0268C16.4077 18.1518 16.711 15.6143 16.7477 15.1368C16.731 14.7768 16.7844 14.5001 16.8994 14.2893C17.0177 14.0726 17.201 13.9401 17.3594 13.8684C17.4385 13.8326 17.5127 13.8085 17.5735 13.7909C17.5091 13.6984 17.4416 13.608 17.371 13.5201C17.1427 13.2433 16.9558 12.9348 16.816 12.6043C16.7491 12.4678 16.6776 12.3335 16.6019 12.2017C16.491 12.0017 16.351 11.7517 16.2044 11.4709C15.911 10.9084 15.5919 10.2267 15.426 9.56257C15.261 8.89922 15.2368 8.21256 15.6602 7.7284C16.0352 7.29839 16.6935 7.12005 17.6819 7.22005C17.6527 7.13255 17.6352 7.06005 17.586 6.94339C17.3626 6.41745 17.0709 5.92319 16.7185 5.47337C15.881 4.40252 14.5252 3.34085 12.4301 3.30668H12.3343V3.30501ZM6.79927 3.34835C6.69343 3.34835 6.58758 3.35168 6.48258 3.35751C5.64092 3.40585 4.84508 3.65001 4.27591 4.25335C3.7059 4.85669 3.3309 5.84588 3.41256 7.48339C3.4284 7.7934 3.5634 8.66172 3.79507 9.69341C4.0259 10.7251 4.35341 11.9392 4.74674 13.0118C5.14091 14.0843 5.61842 15.0176 6.07177 15.4593C6.30008 15.6801 6.49843 15.7693 6.67843 15.7618C6.85927 15.7535 7.07677 15.6493 7.34259 15.3301C7.82728 14.7455 8.33032 14.1763 8.85095 13.6234C8.48154 13.3027 8.19882 12.8941 8.02885 12.4353C7.85891 11.9766 7.80716 11.4824 7.87844 10.9984C7.96428 10.3826 7.97594 9.80673 7.96594 9.35172C7.95594 8.90841 7.92428 8.6134 7.92428 8.42921C7.92413 8.42393 7.92413 8.41868 7.92428 8.4134V8.40921L7.92344 8.40421V8.4034C7.92294 7.44405 8.08991 6.49198 8.41679 5.59003C8.6501 4.97003 8.9976 4.34002 9.51845 3.83002C9.00679 3.66168 8.09844 3.40501 7.11509 3.35668C7.00962 3.35126 6.90405 3.34848 6.79843 3.34835H6.79927ZM17.131 7.75005C16.5652 7.75755 16.2477 7.9034 16.081 8.09421C15.8452 8.36506 15.8227 8.84006 15.9694 9.42507C16.1152 10.0109 16.4169 10.6659 16.7002 11.2101C16.8419 11.4826 16.9794 11.7276 17.0902 11.9267C17.2019 12.1267 17.2835 12.2684 17.3335 12.3892C17.3794 12.5009 17.4302 12.5993 17.4819 12.6909C17.701 12.2284 17.7402 11.7742 17.7177 11.3009C17.6885 10.7151 17.5527 10.1159 17.5727 9.50922C17.5952 8.80006 17.7352 8.3384 17.7477 7.79005C17.5432 7.76355 17.3372 7.75021 17.131 7.75005ZM10.2693 7.8459C10.0964 7.84749 9.92427 7.86818 9.75596 7.90755C9.42048 7.98905 9.09736 8.1149 8.7951 8.28171C8.69288 8.33656 8.59557 8.40012 8.50429 8.47171L8.48594 8.4884C8.49094 8.61006 8.5151 8.90506 8.5251 9.33922C8.5351 9.81423 8.52344 10.4201 8.43179 11.0759C8.2326 12.5009 9.26679 13.6809 10.4818 13.6826C10.5526 13.3901 10.6693 13.0934 10.786 12.7809C11.1243 11.8692 11.7901 11.2042 11.2293 8.60922C11.1376 8.18421 10.956 8.01255 10.706 7.9159C10.5658 7.86633 10.4179 7.84261 10.2693 7.8459ZM16.8669 8.0159H16.9085C16.9635 8.01755 17.0144 8.0234 17.0585 8.03421C17.1035 8.04421 17.1419 8.05921 17.1735 8.08005C17.1898 8.09012 17.2037 8.10346 17.2145 8.11927C17.2253 8.13505 17.2326 8.15293 17.236 8.17171L17.2352 8.1784C17.2368 8.21796 17.2267 8.25709 17.206 8.2909C17.1815 8.33662 17.1506 8.37871 17.1144 8.4159C17.0298 8.509 16.9166 8.57115 16.7927 8.59256C16.6721 8.60712 16.5504 8.57656 16.451 8.50671C16.4103 8.47937 16.3739 8.44625 16.3427 8.4084C16.3157 8.37865 16.2975 8.34203 16.2902 8.30256C16.2885 8.28334 16.2906 8.26396 16.2967 8.24562C16.3027 8.22727 16.3124 8.21034 16.3252 8.1959C16.3525 8.16481 16.3856 8.13934 16.4227 8.1209C16.5027 8.0759 16.611 8.04255 16.7335 8.02421C16.7794 8.01755 16.8244 8.01421 16.8669 8.0134V8.0159ZM10.3501 8.1559C10.3943 8.1559 10.441 8.16005 10.4885 8.16671C10.616 8.18421 10.7293 8.2184 10.816 8.2684C10.8582 8.29046 10.8959 8.32043 10.9268 8.35671C10.9437 8.37596 10.9563 8.39849 10.9641 8.42287C10.9718 8.44725 10.9745 8.47296 10.9718 8.4984C10.9638 8.54631 10.9421 8.59087 10.9093 8.62672C10.8752 8.66859 10.835 8.70509 10.7901 8.73506C10.6817 8.81184 10.5486 8.84541 10.4168 8.82922C10.2821 8.80709 10.1588 8.74015 10.0668 8.63922C10.0277 8.59859 9.99455 8.55256 9.96846 8.50256C9.94099 8.45856 9.92896 8.40665 9.9343 8.35506C9.9468 8.26506 10.021 8.2184 10.0935 8.19256C10.1761 8.16618 10.2627 8.15487 10.3493 8.15921L10.3501 8.1559ZM17.9002 14.2751L17.8977 14.276C17.7752 14.3201 17.6744 14.3385 17.5894 14.376C17.5034 14.409 17.4326 14.4725 17.3902 14.5543C17.3377 14.6501 17.2927 14.8201 17.306 15.1093C17.3437 15.1352 17.3854 15.1549 17.4294 15.1676C17.5719 15.211 17.811 15.2393 18.0777 15.2351C18.6094 15.2293 19.2635 15.1051 19.611 14.9435C19.8961 14.811 20.1608 14.6384 20.3969 14.431H20.3961C19.2352 14.671 18.5794 14.6068 18.1769 14.441C18.0769 14.3994 17.9837 14.3432 17.9002 14.2743V14.2751ZM11.2076 14.3535H11.1901C11.146 14.3576 11.0818 14.3726 10.9576 14.5101C10.6676 14.8351 10.566 15.0393 10.3268 15.2301C10.0876 15.4201 9.7768 15.5218 9.15595 15.6493C8.95929 15.6893 8.84679 15.7335 8.77179 15.7693C8.79595 15.7893 8.79345 15.7943 8.8301 15.8135C8.92095 15.8635 9.0376 15.9076 9.13179 15.9318C9.39845 15.9985 9.8368 16.076 10.2943 15.9985C10.7518 15.9201 11.2276 15.701 11.6335 15.1318C11.7035 15.0335 11.711 14.8885 11.6535 14.7326C11.5951 14.5768 11.4676 14.4426 11.3776 14.4051C11.3241 14.3793 11.2667 14.3624 11.2076 14.3551V14.3535Z" fill="#ffffff" />
    </svg>, available: false
  },
  {
    id: 'mysql', label: 'MySQL', icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(0 0 0)">
      <path fillRule="evenodd" clipRule="evenodd" d="M20.4221 17.3372C19.3341 17.3069 18.4901 17.4184 17.7827 17.716C17.579 17.7978 17.2522 17.7978 17.2253 18.0541C17.3342 18.1617 17.3473 18.3378 17.4427 18.4869C17.6058 18.7575 17.8918 19.122 18.1501 19.3111L19.0207 19.9332C19.5512 20.2575 20.1498 20.4469 20.6666 20.7714C20.966 20.9608 21.2652 21.2041 21.5646 21.4071C21.717 21.5153 21.8094 21.6914 22 21.7587V21.7178C21.9049 21.5965 21.8774 21.4208 21.7826 21.285L21.374 20.8932C20.9797 20.366 20.4897 19.906 19.9592 19.5278C19.5238 19.2302 18.5718 18.8247 18.395 18.3248L18.3681 18.2945C18.6669 18.2641 19.0207 18.159 19.3067 18.0778C19.7695 17.9566 20.1909 17.9833 20.6666 17.8617L21.32 17.6723V17.5511C21.0752 17.3078 20.8983 16.9832 20.6401 16.7536C19.9464 16.1587 19.1841 15.5772 18.395 15.0906C17.9733 14.8203 17.429 14.6442 16.9801 14.4148C16.8164 14.3336 16.5447 14.293 16.4496 14.1578C16.2041 13.8609 16.0685 13.4684 15.8916 13.1166L14.7762 10.7642C14.5314 10.237 14.3813 9.7097 14.0825 9.22305C12.6811 6.92458 11.1571 5.53219 8.81722 4.16644C8.3141 3.8825 7.71557 3.76038 7.07918 3.6119L6.05895 3.55735C5.84091 3.46281 5.6235 3.20584 5.43294 3.08403C4.65753 2.59737 2.65758 1.54283 2.08586 2.93251C1.71844 3.81129 2.63014 4.67643 2.93963 5.12278C3.17137 5.43371 3.47018 5.7852 3.63393 6.13673C3.7254 6.36642 3.75589 6.61006 3.85133 6.85338C4.06874 7.44823 4.27303 8.11093 4.55874 8.66549C4.7112 8.94941 4.87128 9.24728 5.06186 9.50394C5.17071 9.65547 5.3613 9.72032 5.40184 9.96365C5.21128 10.2343 5.19815 10.6394 5.0893 10.9779C4.59929 12.5057 4.78987 14.3984 5.48357 15.5233C5.70158 15.8612 6.21535 16.6051 6.9124 16.3209C7.52466 16.0775 7.38808 15.3069 7.56492 14.6309C7.60608 14.4687 7.57864 14.3606 7.66006 14.2521V14.2824L8.21806 15.4045C8.63975 16.0669 9.37459 16.7566 9.98657 17.2166C10.3128 17.4599 10.5714 17.8793 10.9794 18.0278V17.9869H10.9525C10.8708 17.8657 10.7483 17.8111 10.6394 17.7166C10.3945 17.4733 10.1226 17.1757 9.932 16.9054C9.36087 16.1484 8.85776 15.3099 8.40862 14.4448C8.19061 14.0257 8.00005 13.566 7.8238 13.147C7.74148 12.9845 7.74148 12.7409 7.6058 12.6603C7.40148 12.9572 7.10268 13.2148 6.95235 13.5797C6.69377 14.1609 6.66696 14.8775 6.57182 15.6211C6.51693 15.6348 6.54131 15.6211 6.51693 15.6515C6.08211 15.5436 5.93208 15.0969 5.76896 14.7187C5.36099 13.7587 5.29267 12.2176 5.64638 11.1088C5.74152 10.8249 6.15012 9.93242 5.98697 9.66213C5.90464 9.40518 5.63328 9.25668 5.48326 9.05365C5.30639 8.7967 5.11643 8.47246 4.99386 8.18851C4.6676 7.43094 4.50447 6.59309 4.15046 5.8358C3.98671 5.48431 3.70131 5.11915 3.46988 4.79492C3.21131 4.42977 2.92622 4.1728 2.72192 3.74038C2.65392 3.58887 2.55879 3.34827 2.66765 3.18585C2.69448 3.07766 2.74936 3.03433 2.85761 3.01009C3.03446 2.85858 3.53818 3.0507 3.71503 3.1313C4.21815 3.33433 4.63985 3.52342 5.06155 3.80705C5.25213 3.9422 5.45641 4.19917 5.70126 4.26704H5.98728C6.4227 4.36159 6.91209 4.29735 7.31978 4.41856C8.0409 4.64886 8.69373 4.98644 9.27917 5.35188C11.0611 6.47397 12.5308 8.06943 13.5236 9.97609C13.6867 10.287 13.7547 10.5709 13.9048 10.8955C14.1908 11.5582 14.5445 12.2339 14.8296 12.8833C15.1156 13.5188 15.3876 14.1682 15.7955 14.6954C15.9998 14.9794 16.8158 15.1278 17.1829 15.2766C17.4552 15.3978 17.8766 15.5069 18.1221 15.6554C18.5843 15.9393 19.0469 16.2639 19.482 16.5748C19.6994 16.7366 20.38 17.0748 20.4205 17.3445L20.4221 17.3372ZM6.54834 5.58823C6.36037 5.58658 6.173 5.6093 5.99094 5.65581V5.68612H6.01779C6.12662 5.90247 6.31721 6.05128 6.4532 6.24065L6.76635 6.88973L6.79316 6.85944C6.98376 6.7243 7.07918 6.50792 7.07918 6.18367C6.99748 6.08916 6.98407 5.9943 6.91606 5.89975C6.83433 5.76461 6.65749 5.69672 6.54834 5.58886V5.58823Z" fill="#ffffff" />
    </svg>, available: false
  },
  {
    id: 'mongodb', label: 'MongoDB', icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(0 0 0)">
      <path d="M13.7408 4.2309C12.8994 3.23804 12.1745 2.22263 12.0273 2.01426C12.0242 2.00986 12.0202 2.00627 12.0154 2.00378C12.0107 2.0013 12.0054 2 12 2C11.9947 2 11.9894 2.0013 11.9847 2.00378C11.9799 2.00627 11.9759 2.00987 11.9728 2.01427C11.8256 2.22264 11.1009 3.23805 10.2596 4.2309C3.04835 13.4177 11.3977 19.6158 11.3977 19.6158L11.4654 19.6629C11.5287 20.6218 11.686 22 11.686 22H12.3143C12.3143 22 12.4709 20.6277 12.5345 19.6691L12.6026 19.6158C12.6026 19.6158 20.9519 13.4177 13.7408 4.2309ZM12.0002 19.4811C12.0002 19.4811 11.6258 19.1619 11.5248 19.0019L11.5239 18.9847L11.9766 8.98294C11.9769 8.97687 11.9795 8.97116 11.9839 8.96697C11.9883 8.96278 11.9941 8.96044 12.0001 8.96044C12.0062 8.96044 12.012 8.96278 12.0164 8.96697C12.0208 8.97116 12.0234 8.97687 12.0237 8.98294L12.4764 18.9847L12.4755 19.0018C12.3746 19.1618 12.0002 19.4811 12.0002 19.4811Z" fill="#ffffff" />
    </svg>, available: false
  },
  {
    id: 'google-sheets', label: 'Google Sheets', icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(0 0 0)">
      <path d="M21.5939 11.0792H12.3209V13.8256H18.9768C18.6214 17.6382 15.5196 19.286 12.5148 19.286C8.70223 19.286 5.30969 16.3135 5.30969 12.0162C5.30969 7.88057 8.54068 4.74651 12.5148 4.74651C15.5519 4.74651 17.3936 6.71741 17.3936 6.71741L19.2676 4.74651C19.2676 4.74651 16.7474 2.00016 12.3856 2.00016C6.6344 1.96785 2.24023 6.78203 2.24023 11.9839C2.24023 17.0243 6.37592 22 12.4825 22C17.8783 22 21.7554 18.349 21.7554 12.8886C21.7877 11.7578 21.5939 11.0792 21.5939 11.0792Z" fill="#ffffff" />
    </svg>, available: false
  },
  { id: 'csv', label: 'CSV File', icon: <FileText size={26} />, available: false },
];

const CmsTab: React.FC = () => {
  const { projectId } = useBuilderStore();
  const router = useRouter();
  const [collections, setCollections] = useState<CmsCollectionWithRecords[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDataSourcePickerOpen, setIsDataSourcePickerOpen] = useState(false);

  useEffect(() => {
    if (!projectId) {
      setCollections([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch(`/api/cms/${encodeURIComponent(projectId)}`)
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Unable to load CMS collections')))
      .then(data => {
        if (cancelled) return;
        const nextCollections = Array.isArray(data) ? data as CmsCollectionWithRecords[] : [];
        setCollections(nextCollections);
        setSelectedId(current => nextCollections.some(collection => collection.id === current) ? current : nextCollections[0]?.id || '');
      })
      .catch(value => { if (!cancelled) setError(value instanceof Error ? value.message : 'Unable to load CMS collections'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [projectId]);

  const selected = collections.find(collection => collection.id === selectedId) || collections[0];
  const records = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!selected || !query) return selected?.records || [];
    return selected.records.filter(record => selected.fields.some(field => String(record.data[field] ?? '').toLowerCase().includes(query)));
  }, [search, selected]);

  const openDataSource = (source: DataSourceDefinition) => {
    if (!projectId || !source.available || !source.href) return;
    setIsDataSourcePickerOpen(false);
    router.push(source.href(projectId));
  };

  if (!projectId) return <div className="p-4 text-xs text-gray-500">Save the project to add data sources.</div>;
  if (loading) return <div className="p-4 text-xs text-gray-500">Loading CMS...</div>;
  if (error) return <div className="p-4 text-xs text-red-300">{error}</div>;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#111114] text-gray-200">
      <div className="flex items-center justify-between border-b border-gray-800 px-3 py-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">Data Sources</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setIsDataSourcePickerOpen(true)} title="Add data source" aria-label="Add data source" className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-200"><Plus size={14} /></button>
          <a href={`/dashboard/settings/${projectId}/cms`} rel="noreferrer" title="Open CMS settings" className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-200"><ExternalLink size={14} /></a>
        </div>
      </div>
      {collections.length === 0 ? <div className="flex flex-1 flex-col items-center justify-center p-5 text-center">
        <Database size={30} className="mb-3 text-gray-600" />
        <p className="text-xs font-medium text-gray-300">No data sources in this project</p>
        <p className="mt-2 max-w-48 text-[11px] leading-5 text-gray-500">Connect a source to bring external data into your project.</p>
        <button type="button" onClick={() => setIsDataSourcePickerOpen(true)} className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500"><Plus size={13} /> Add data source</button>
      </div> : <>
        <div className="border-b border-gray-800 px-2 py-2">
          <button type="button" onClick={() => setIsDataSourcePickerOpen(true)} className="flex w-full items-center gap-2 rounded-md bg-gray-800/70 px-2.5 py-2 text-left text-xs text-gray-200 hover:bg-gray-700"><Database size={14} className="text-blue-300" /><span className="flex-1">LUNIO CMS</span><Plus size={13} className="text-gray-500" /></button>
        </div>
        <div className="border-b border-gray-800 p-2">
          {collections.map(collection => <button key={collection.id} type="button" onClick={() => { setSelectedId(collection.id); setSearch(''); }} className={`mb-1 flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-xs ${selected?.id === collection.id ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/70 hover:text-gray-200'}`}>
            <span className="truncate">{collection.name}</span><span className="ml-2 shrink-0 text-[10px] text-gray-500">{collection.records.length}</span>
          </button>)}
        </div>
        {selected && <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="sticky top-0 z-10 border-b border-gray-800 bg-[#111114] p-2">
            <label className="relative block">
              <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600" />
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder={`Search ${selected.name.toLowerCase()}...`} className="w-full rounded-md border border-gray-700 bg-gray-900 py-1.5 pl-8 pr-2 text-xs text-gray-200 outline-none focus:border-blue-400" />
            </label>
          </div>
          <div className="p-2">
            {records.length === 0 ? <p className="p-3 text-xs text-gray-500">No records found.</p> : records.map(record => <div key={record.id} className="border-b border-gray-800/70 px-2 py-2 last:border-0">
              <p className="truncate text-xs font-medium text-gray-200">{String(record.data[selected.fields[0]] ?? record.id)}</p>
              <p className="mt-1 truncate text-[10px] text-gray-500">{selected.fields.slice(1, 3).map(field => `${field}: ${String(record.data[field] ?? '')}`).join(' · ')}</p>
            </div>)}
          </div>
        </div>}
      </>}
      <Dialog open={isDataSourcePickerOpen} onOpenChange={setIsDataSourcePickerOpen}>
        <DialogContent className="max-w-3xl border-gray-700 bg-[#1b1b1f] text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-gray-100">Add data source</DialogTitle>
            <DialogDescription className="text-gray-400">Choose a source to connect to this project. More connectors can be added without changing the panel.</DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[60vh] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
            {DATA_SOURCE_DEFINITIONS.map(source => (
              <button
                key={source.id}
                type="button"
                disabled={!source.available}
                onClick={() => openDataSource(source)}
                className="group flex min-h-28 flex-col items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-800/80 p-3 text-center transition hover:border-blue-400 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:border-gray-700 disabled:hover:bg-gray-800/80"
              >
                <span className="text-gray-300 group-hover:text-blue-300">{source.icon}</span>
                <span className="text-xs font-semibold text-gray-100">{source.label}</span>
                <span className="text-[10px] leading-4 text-gray-500">{source.available ? 'Available' : 'Coming soon'}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ComponentsTab: React.FC = () => {
  const { setDraggedElementType, addElementFromPalette, selectedElementId, getElementById } = useBuilderStore();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(COMPONENT_CATEGORIES))
  );
  const [search, setSearch] = useState('');

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, type: ElementType) => {
    e.dataTransfer.setData('elementType', type);
    e.dataTransfer.setData('text/plain', type);
    e.dataTransfer.effectAllowed = 'copy';
    setDraggedElementType(type);
  };

  const handleDragEnd = () => {
    setDraggedElementType(null);
  };

  const handleDoubleClick = (type: ElementType) => {
    const selectedElement = selectedElementId ? getElementById(selectedElementId) : null;
    addElementFromPalette(type, selectedElement && canHaveChildren(selectedElement.type) ? selectedElement.id : 'canvas-root', 'inside');
  };

  const filteredCategories = Object.entries(COMPONENT_CATEGORIES).map(([cat, types]) => ({
    cat,
    types: (types as readonly ElementType[]).filter(t =>
      !search || COMPONENT_LABELS[t].toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(({ types }) => types.length > 0);

  return (
    <div className="p-3">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Components</span>
      <div className="relative mb-3 mt-3">
        <input
          type="text"
          placeholder="Search components..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-700"
        />
      </div>

      {filteredCategories.map(({ cat, types }) => (
        <div key={cat} className="mb-2">
          <button
            onClick={() => toggleCategory(cat)}
            className="w-full flex items-center justify-between px-1 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-200 transition-colors"
          >
            {cat}
            {expandedCategories.has(cat) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>

          {expandedCategories.has(cat) && (
            <div className="grid grid-cols-2 gap-1.5 mt-1">
              {(types as ElementType[]).map(type => (
                <div
                  key={type}
                  draggable
                  onDragStart={e => handleDragStart(e, type)}
                  onDragEnd={handleDragEnd}
                  onDoubleClick={() => handleDoubleClick(type)}
                  className="flex flex-col items-center gap-2 bg-gray-800/60 hover:bg-gray-700/80 border border-gray-700/50 hover:border-gray-600 rounded-lg px-2.5 py-2 cursor-grab active:cursor-grabbing transition-all group"
                  title={`Double-click to add, drag to place`}
                >
                  <span className="text-gray-400 group-hover:text-blue-300 transition-colors shrink-0">
                    {COMPONENT_ICONS[type] || <Square size={14} />}
                  </span>
                  <span className="text-[10px] text-gray-300 group-hover:text-white transition-colors truncate">
                    {COMPONENT_LABELS[type]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <p className="text-xs text-gray-600 text-center mt-4">Drag or double-click to add</p>
    </div>
  );
};

const ComponentLibraryTab: React.FC = () => {
  const { pages, selectedElementId, getElementById, addComponentFromPalette, setDraggedElementType } = useBuilderStore();
  const [search, setSearch] = useState('');
  const components = getComponentElements(pages);
  const filteredComponents = components.filter(component => {
    const query = search.trim().toLowerCase();
    return !query || `${component.componentName || ''} ${component.name}`.toLowerCase().includes(query);
  });
  const getTarget = () => {
    const selected = selectedElementId ? getElementById(selectedElementId) : null;
    return selected?.type === 'cmsMap' ? selected.id : 'canvas-root';
  };

  const handleDragStart = (event: React.DragEvent, component: BuilderElement) => {
    event.dataTransfer.setData('componentId', component.id);
    event.dataTransfer.setData('text/plain', component.id);
    event.dataTransfer.effectAllowed = 'copy';
    setDraggedElementType(null);
  };

  const handleDoubleClick = (component: BuilderElement) => {
    addComponentFromPalette(component.id, getTarget(), 'inside');
  };

  return (
    <div className="p-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Saved Components</span>
      <div className="relative mb-3 mt-3">
        <input
          type="text"
          placeholder="Search components..."
          value={search}
          onChange={event => setSearch(event.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      {filteredComponents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-700 p-4 text-center text-xs text-gray-500">
          {components.length === 0 ? 'Mark an element as a component to reuse it here.' : 'No components found.'}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredComponents.map(component => {
            const sourcePage = pages.find(page => page.elements.some(element => element.id === component.id))?.name;
            return (
              <div
                key={component.id}
                draggable
                onDragStart={event => handleDragStart(event, component)}
                onDoubleClick={() => handleDoubleClick(component)}
                className="flex cursor-grab items-center gap-2 rounded-lg border border-gray-700/60 bg-gray-800/60 px-2.5 py-2 hover:border-gray-600 hover:bg-gray-700/80 active:cursor-grabbing"
                title="Double-click to add, or drag onto the canvas"
              >
                <span className="text-blue-300"><Blocks size={18} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-gray-200">{component.componentName || component.name}</span>
                  {sourcePage && <span className="block truncate text-[10px] text-gray-500">{sourcePage}</span>}
                </span>
                <Copy size={13} className="shrink-0 text-gray-600" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const getSiblingIds = (page: Page, parentId: string | null): string[] => {
  const find = (elements: BuilderElement[], currentParentId: string | null): string[] | null => {
    if (currentParentId === null) {
      return elements.map(el => el.id);
    }

    for (const el of elements) {
      if (el.id === currentParentId) {
        return el.children.map(child => child.id);
      }
      const nested = find(el.children, currentParentId);
      if (nested) return nested;
    }

    return null;
  };

  return find(page.elements, parentId) || [];
};

const isDescendant = (ancestorId: string, descendantId: string, page: Page): boolean => {
  const findElement = (elements: BuilderElement[]): BuilderElement | null => {
    for (const el of elements) {
      if (el.id === ancestorId) return el;
      const found = findElement(el.children);
      if (found) return found;
    }
    return null;
  };

  const ancestor = findElement(page.elements);
  if (!ancestor) return false;

  const search = (elements: BuilderElement[]): boolean => {
    for (const el of elements) {
      if (el.id === descendantId) return true;
      if (search(el.children)) return true;
    }
    return false;
  };

  return search(ancestor.children);
};

const containsElement = (element: BuilderElement, id: string): boolean => (
  element.children.some(child => child.id === id || containsElement(child, id))
);

const LayerItem: React.FC<{ element: BuilderElement; depth: number; collapseSignal: number }> = ({ element, depth, collapseSignal }) => {
  const {
    selectedElementId,
    selectElement,
    deleteElement,
    duplicateElement,
    toggleElementLock,
    toggleElementVisibility,
    toggleElementComponent,
  } = useBuilderStore();

  const [isExpanded, setIsExpanded] = useState(true);
  const layerRef = useRef<HTMLDivElement>(null);
  const hasChildren = element.children.length > 0;
  const isSelected = selectedElementId === element.id;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: element.id });

  useEffect(() => {
    if (collapseSignal > 0) setIsExpanded(false);
  }, [collapseSignal]);

  useEffect(() => {
    if (hasChildren && selectedElementId && containsElement(element, selectedElementId)) {
      setIsExpanded(true);
    }
    if (isSelected) {
      requestAnimationFrame(() => layerRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
    }
  }, [element, hasChildren, isSelected, selectedElementId]);

  return (
    <div
      ref={node => { setNodeRef(node); layerRef.current = node; }}
      data-layer-id={element.id}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'opacity-50' : ''}
    >
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded-md mx-1 group transition-colors ${isSelected ? 'bg-blue-600/20 text-blue-300' : 'hover:bg-gray-800/80 text-gray-400 hover:text-gray-200'
          }`}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
        onClick={() => selectElement(isSelected ? null : element.id)}
      >
        {hasChildren ? (
          <button
            onClick={e => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className="text-gray-500 hover:text-gray-300 shrink-0"
          >
            {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          </button>
        ) : (
          <span className="w-3 shrink-0" />
        )}

        <button
          {...attributes}
          {...listeners}
          onClick={e => e.stopPropagation()}
          className="text-gray-500 hover:text-gray-300 shrink-0 p-0.5 rounded cursor-grab active:cursor-grabbing"
          title="Drag to reorder"
        >
          <Move size={10} />
        </button>

        <span className="text-gray-500 shrink-0">
          {COMPONENT_ICONS[element.type] || <Square size={12} />}
        </span>

        <span className="flex-1 text-xs truncate">{element.name}</span>

        <div className="hidden group-hover:flex items-center gap-0.5">
          <button
            onClick={e => { e.stopPropagation(); toggleElementVisibility(element.id); }}
            className="p-0.5 text-gray-500 hover:text-gray-200 rounded"
            title={element.hidden ? 'Show' : 'Hide'}
          >
            {element.hidden ? <EyeOff size={10} /> : <Eye size={10} />}
          </button>
          <button
            onClick={e => { e.stopPropagation(); toggleElementLock(element.id); }}
            className="p-0.5 text-gray-500 hover:text-gray-200 rounded"
            title={element.locked ? 'Unlock' : 'Lock'}
          >
            {element.locked ? <Lock size={10} /> : <Unlock size={10} />}
          </button>
          <button
            onClick={e => { e.stopPropagation(); duplicateElement(element.id); }}
            className="p-0.5 text-gray-500 hover:text-gray-200 rounded"
          >
            <Copy size={10} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); toggleElementComponent(element.id); }}
            className={`p-0.5 rounded ${element.isComponent ? 'text-blue-300 hover:text-blue-100' : 'text-gray-500 hover:text-gray-200'}`}
            title={element.isComponent ? 'Remove component tag' : 'Export as component'}
          >
            <Package size={10} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); deleteElement(element.id); }}
            className="p-0.5 text-gray-500 hover:text-red-400 rounded"
          >
            <Trash2 size={10} />
          </button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <SortableContext items={element.children.map(child => child.id)} strategy={verticalListSortingStrategy}>
          {element.children.map(child => (
            <LayerItem key={child.id} element={child} depth={depth + 1} collapseSignal={collapseSignal} />
          ))}
        </SortableContext>
      )}
    </div>
  );
};

const LayersTab: React.FC = () => {
  const { getCurrentPage, getElementById, moveElement } = useBuilderStore();
  const page = getCurrentPage();
  const sensors = useSensors(useSensor(PointerSensor));
  const [collapseSignal, setCollapseSignal] = useState(0);

  const handleDragEnd = (event: DragEndEvent) => {
    const activeId = event.active.id as string;
    const overId = event.over?.id as string;
    if (!overId || activeId === overId) return;

    const activeElement = getElementById(activeId);
    const overElement = getElementById(overId);
    if (!activeElement || !overElement) return;
    if (isDescendant(activeId, overId, page)) return;

    const siblingIds = getSiblingIds(page, overElement.parentId);
    const activeIndex = siblingIds.indexOf(activeId);
    const overIndex = siblingIds.indexOf(overId);
    const position: 'before' | 'after' = activeIndex !== -1 && activeIndex < overIndex ? 'after' : 'before';

    moveElement(activeId, overId, position);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="py-2">
        <div className="flex items-center justify-between px-3 pb-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Layers</span>
          <button
            type="button"
            onClick={() => setCollapseSignal(signal => signal + 1)}
            className="p-1 text-gray-500 hover:text-gray-200 rounded transition-colors"
            title="Collapse all layers"
            aria-label="Collapse all layers"
          >
            <ChevronsDownUp size={14} />
          </button>
        </div>
        {page.elements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-600">
            <Layers size={24} className="mb-2" />
            <p className="text-xs">No elements yet</p>
          </div>
        ) : (
          <SortableContext items={page.elements.map(el => el.id)} strategy={verticalListSortingStrategy}>
            {page.elements.map(el => (
              <LayerItem key={el.id} element={el} depth={0} collapseSignal={collapseSignal} />
            ))}
          </SortableContext>
        )}
      </div>
    </DndContext>
  );
};

const PagesTab: React.FC = () => {
  const { pages, currentPageId, setCurrentPage, addPage, deletePage, updatePageName, updatePageSlug, updatePageCmsDetail } = useBuilderStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null);

  const startEdit = (page: Page) => {
    setEditingId(page.id);
    setEditName(page.name);
    setEditSlug(page.slug.replace(/^\/+/, ''));
  };

  const commitEdit = () => {
    if (editingId && editName.trim()) {
      updatePageName(editingId, editName.trim());
    }
    if (editingId && editSlug.trim()) updatePageSlug(editingId, editSlug);
    setEditingId(null);
  };

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pages</span>
        <button
          onClick={addPage}
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          <Plus size={12} />
          Add
        </button>
      </div>

      <div className="space-y-1">
        {pages.map(page => (
          <div
            key={page.id}
            className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${page.id === currentPageId
              ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
              : 'hover:bg-gray-800 text-gray-400 border border-transparent'
              }`}
            onClick={() => setCurrentPage(page.id)}
          >
            <Globe size={12} className="shrink-0" />

            {editingId === page.id ? (
              <div className="flex-1 min-w-0 flex flex-col gap-1" onClick={e => e.stopPropagation()}>
                <input
                  className="w-full bg-gray-800 text-white text-xs px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null); }}
                  autoFocus
                  aria-label="Page name"
                />
                {page.slug === '/' ? (
                  <span className="text-xs text-gray-600" title="The homepage URL cannot be changed">/</span>
                ) : (
                  <div className="flex items-center text-xs text-gray-500">
                    <span>/</span>
                    <input
                      className="min-w-0 flex-1 bg-gray-800 text-gray-300 px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={editSlug}
                      onChange={e => setEditSlug(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null); }}
                      aria-label="Page URL slug"
                    />
                  </div>
                )}
              </div>
            ) : (
              <span
                className="flex-1 text-xs truncate"
                onDoubleClick={e => { e.stopPropagation(); startEdit(page); }}
              >
                {page.name}
              </span>
            )}

            {editingId !== page.id && <span
              className={`text-xs ${page.slug === '/' ? 'text-gray-600' : 'text-gray-500 hover:text-gray-300 cursor-text'}`}
              onDoubleClick={e => { e.stopPropagation(); startEdit(page); }}
              title={page.slug === '/' ? 'The homepage URL cannot be changed' : 'Double-click to edit the page URL slug'}
            >{page.slug}</span>}

            {page.slug !== '/' && <button
              type="button"
              onClick={e => { e.stopPropagation(); updatePageCmsDetail(page.id, { enabled: !page.cmsDetail?.enabled }); }}
              aria-label={`${page.cmsDetail?.enabled ? 'Disable' : 'Enable'} single post page for ${page.name}`}
              title={page.cmsDetail?.enabled ? 'Single post page enabled' : 'Enable single post page'}
              className={`shrink-0 text-[10px] ${page.cmsDetail?.enabled ? 'text-emerald-300' : 'text-gray-600 hover:text-gray-300'}`}
            >SP</button>}

            {pages.length > 1 && page.slug !== '/' && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={e => { e.stopPropagation(); setPageToDelete(page); }}
                aria-label={`Delete page ${page.name}`}
                className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-colors"
              >
                <Trash2 size={10} />
              </Button>
            )}
          </div>
        ))}
      </div>
      <Dialog open={Boolean(pageToDelete)} onOpenChange={open => { if (!open) setPageToDelete(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete page?</DialogTitle>
            <DialogDescription>Delete page &quot;{pageToDelete?.name}&quot;? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPageToDelete(null)}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={() => { if (pageToDelete) deletePage(pageToDelete.id); setPageToDelete(null); }}>Delete page</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
