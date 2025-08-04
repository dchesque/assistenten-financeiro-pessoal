import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}
export interface PageHeaderProps {
  breadcrumb: BreadcrumbItem[];
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}
export function PageHeader({
  breadcrumb,
  title,
  subtitle,
  actions,
  icon
}: PageHeaderProps) {
  return <div className="backdrop-blur-sm border-b border-gray-200/50 px-4 lg:px-8 py-6 bg-white/[0.19]">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumb.map((item, index) => <React.Fragment key={index}>
                <BreadcrumbItem>
                  {item.href ? <BreadcrumbLink asChild>
                      <Link to={item.href} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                        {item.icon}
                        {item.label}
                      </Link>
                    </BreadcrumbLink> : <BreadcrumbPage className="flex items-center gap-2 font-medium text-gray-900">
                      {item.icon}
                      {item.label}
                    </BreadcrumbPage>}
                </BreadcrumbItem>
                {index < breadcrumb.length - 1 && <BreadcrumbSeparator>
                    <ChevronRight className="w-4 h-4" />
                  </BreadcrumbSeparator>}
              </React.Fragment>)}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Title Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            {icon}
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              {title}
            </h1>
          </div>
          <p className="text-sm text-gray-600">
            {subtitle}
          </p>
        </div>
        
        {/* Actions */}
        {actions && <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {actions}
          </div>}
      </div>
    </div>;
}