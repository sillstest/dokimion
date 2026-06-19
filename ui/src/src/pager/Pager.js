/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable eqeqeq */
import React, { useState, useEffect } from "react";
import * as Utils from "../common/Utils";

function buildPageObjects(totalItems, currentPage, visiblePages, itemsOnPage) {
  var totalPages = Utils.intDiv(totalItems, itemsOnPage);
  if (totalItems / itemsOnPage - totalPages > 0) totalPages++;

  var startFromPage = Math.min(currentPage - Utils.intDiv(visiblePages, 2) - 1, totalPages - 1 - visiblePages);
  startFromPage = Math.max(0, startFromPage);
  var endPage = Math.min(totalPages - 1, startFromPage + visiblePages);
  endPage = Math.max(0, endPage);

  var result = [];
  result.push({ title: "<", index: Math.max(currentPage - 1, 0), enabled: currentPage != 0 });

  var startPageTitle = startFromPage + 1;
  if (startFromPage + 1 > Utils.intDiv(visiblePages, 2)) startPageTitle = "...";
  result.push({ title: startPageTitle, index: startFromPage, enabled: startFromPage != currentPage });

  for (var i = startFromPage + 1; i < endPage; i++) {
    result.push({ title: i + 1, index: i, enabled: i != currentPage });
  }

  var endPageTitle = endPage + 1;
  if (endPage < totalPages - 1 && totalPages > visiblePages) endPageTitle = "...";
  if (startFromPage != endPage) {
    result.push({ title: endPageTitle, index: endPage, enabled: endPage != currentPage });
  }

  result.push({
    title: ">",
    index: Math.min(currentPage + 1, totalPages - 1),
    enabled: currentPage != Math.max(totalPages - 1, 0),
  });

  return result;
}

function Pager({ totalItems, currentPage, visiblePages, itemsOnPage, onPageChanged }) {
  const [pageObjects, setPageObjects] = useState(() =>
    buildPageObjects(totalItems, currentPage, visiblePages, itemsOnPage),
  );

  useEffect(() => {
    setPageObjects(buildPageObjects(totalItems, currentPage, visiblePages, itemsOnPage));
  }, [totalItems, currentPage, visiblePages, itemsOnPage]);

  return (
    <div>
      <nav>
        <ul className="pagination">
          {pageObjects.map((page, idx) => {
            const styleClass = "page-item " + (page.enabled ? "" : "disabled");
            return (
              <li key={idx} className={styleClass}>
                <a className="page-link" href="#" onClick={e => onPageChanged(page.index, e)}>
                  {page.title}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export default Pager;
