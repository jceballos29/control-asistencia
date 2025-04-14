import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AnyRouteMatch, Link, useMatches } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";
import React from "react";

interface MatchWithCrumbLoaderData extends AnyRouteMatch {
  loaderData: {
    crumb?: string;
    [key: string]: any;
  };
}

function hasCrumbLoaderData(
  match: AnyRouteMatch | unknown
): match is MatchWithCrumbLoaderData {
  if (!match || typeof match !== "object") return false;
  const loaderData = (match as any).loaderData;
  return (
    loaderData &&
    typeof loaderData === "object" &&
    typeof loaderData.crumb === "string" &&
    loaderData.crumb.length > 0
  );
}

export function Breadcrumbs() {
  const matches = useMatches();
  console.log("Raw Matches:", matches);

  const breadcrumbMatches = matches
    .filter(hasCrumbLoaderData)
    .sort((a, b) => a.pathname.length - b.pathname.length);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/admin" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbMatches.map((match, index) => {
          const title = match.loaderData?.crumb;

          const isLast = index === breadcrumbMatches.length - 1;

          if (match.pathname === "/admin" || match.pathname === "/admin/") {
            return null;
          }
          return (
            <React.Fragment key={match.id}>
              {index >= 0 && (
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
              )}

              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="flex items-center gap-1">
                    <span>{title}</span>
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      to={match.pathname}
                      params={match.params}
                      className="flex items-center gap-1"
                      activeOptions={{ exact: true }}
                    >
                      <span>{title}</span>
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
