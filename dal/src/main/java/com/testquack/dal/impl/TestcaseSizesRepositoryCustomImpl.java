package com.testquack.dal.impl;

import com.testquack.beans.TestcaseSizes;
import com.testquack.dal.TestcaseSizesRepositoryCustom;

import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import static org.apache.commons.lang3.StringUtils.isEmpty;

import java.util.List;

public class TestcaseSizesRepositoryCustomImpl extends CommonRepositoryImpl<TestcaseSizes>
        implements TestcaseSizesRepositoryCustom {

    @Override
    public Class getEntityClass() {
        return TestcaseSizes.class;
    }

    @Override
    protected String getCollectionName(String organizationId, String projectId) {
        return isEmpty(organizationId) ? "TestcaseSizes" : organizationId + "_rolecapability";
    }

    @Override
    public List<TestcaseSizes> suggestTestcaseSizes(String organizationId, String literal) {
        Criteria criteria = new Criteria();
        criteria.orOperator(
                Criteria.where("role").regex(literal, "i"),
                Criteria.where("capability").regex(literal, "i")
        );
        Query query = new Query(criteria);
        query.limit(20);
        return mongoOperations.find(query, TestcaseSizes.class, getCollectionName(organizationId, null));
    }

}
