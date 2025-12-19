import React, { useMemo } from "react";
import * as Utils from "../common/Utils";

const Pager = ({ totalItems, currentPage, visiblePages, itemsOnPage, onPageChanged }) => {
  const getPageObjects = () => {
    let totalPages = Utils.intDiv(totalItems, itemsOnPage);
    if (totalItems / itemsOnPage - totalPages > 0) {
      totalPages++;
    }

    let startFromPage = Math.min(
      currentPage - Utils.intDiv(visiblePages, 2) - 1,
      totalPages - 1 - visiblePages,
    );
    startFromPage = Math.max(0, startFromPage);
    let endPage = Math.min(totalPages - 1, startFromPage + visiblePages);
    endPage = Math.max(0, endPage);

    const result = [];
    result.push({ 
      title: "<", 
      index: Math.max(currentPage - 1, 0), 
      enabled: currentPage !== 0 
    });

    let startPageTitle = startFromPage + 1;
    if (startFromPage + 1 > Utils.intDiv(visiblePages, 2)) {
      startPageTitle = "...";
    }
    result.push({ 
      title: startPageTitle, 
      index: startFromPage, 
      enabled: startFromPage !== currentPage 
    });

    for (let i = startFromPage + 1; i < endPage; i++) {
      const title = i + 1;
      result.push({ 
        title: title, 
        index: i, 
        enabled: i !== currentPage 
      });
    }

    let endPageTitle = endPage + 1;
    if (endPage < totalPages - 1 && totalPages > visiblePages) {
      endPageTitle = "...";
    }

    if (startFromPage !== endPage) {
      result.push({ 
        title: endPageTitle, 
        index: endPage, 
        enabled: endPage !== currentPage 
      });
    }

    result.push({
      title: ">",
      index: Math.min(currentPage + 1, totalPages - 1),
      enabled: currentPage !== Math.max(totalPages - 1, 0),
    });

    return result;
  };

  const pageObjects = useMemo(() => getPageObjects(), [
    totalItems, 
    currentPage, 
    visiblePages, 
    itemsOnPage
  ]);

  const handlePageClick = (pageIndex, e) => {
    e.preventDefault();
    onPageChanged(pageIndex);
  };

  return (
    <div>
      <nav>
        <ul className="pagination">
          {pageObjects.map((page, idx) => {
            const disabledClass = page.enabled ? "" : "disabled";
            const styleClass = `page-item ${disabledClass}`;
            
            return (
              <li key={idx} className={styleClass}>
                <a 
                  className="page-link" 
                  href="#" 
                  onClick={e => handlePageClick(page.index, e)}
                >
                  {page.title}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Pager;
