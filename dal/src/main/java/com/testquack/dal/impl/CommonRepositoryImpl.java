package com.testquack.dal.impl;

import com.testquack.beans.EntityPreview;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import com.testquack.beans.Entity;
import com.testquack.beans.Filter;
import com.testquack.beans.Order;
import com.testquack.beans.TestcaseSizes;
import com.testquack.dal.CommonRepository;
import org.springframework.data.mongodb.core.query.Update;

import java.util.*;

import static org.apache.commons.lang3.StringUtils.isEmpty;

public abstract class CommonRepositoryImpl<E extends EntityPreview> implements CommonRepository<E> {

    @Autowired
    MongoOperations mongoOperations;

    public abstract Class<E> getEntityClass();

    @Override
    public List<E> find(String organizationId, String projectId, Filter filter) {
System.out.println("CommonRepositoryImpl::find - projectId: " + projectId);
System.out.println("CommonRepositoryImpl::find - filter: " + filter);
System.out.flush();

        String collName = getCollectionName(organizationId, projectId);
        System.out.println("collName - " + collName);
        System.out.println("entity class - " + getEntityClass());
        System.out.println("query - " + DBUtils.getQuery(getEntityClass(), filter));
        System.out.flush();

        List<E> listEntity = mongoOperations.find(DBUtils.getQuery(getEntityClass(), filter),
                getEntityClass(),
                getCollectionName(organizationId, projectId));

System.out.println("CommonRepositoryImpl::find - entity list: " + listEntity);
System.out.flush();

        return listEntity;

/*
        return mongoOperations.find(DBUtils.getQuery(getEntityClass(), filter),
                getEntityClass(),
                getCollectionName(organizationId, projectId));
*/


    }

    @Override
    public long count(String organizationId, String projectId, Filter filter) {
System.out.println("CommonRepositoryImpl::count");
System.out.flush();

        return mongoOperations.count(DBUtils.getQuery(getEntityClass(), filter),
                getEntityClass(),
                getCollectionName(organizationId, projectId));

    }

    @Override
    public E save(String organizationId, String projectId, E entity) {
System.out.println("CommonRepositoryImpl::save");
System.out.flush();

        mongoOperations.save(entity, getCollectionName(organizationId, projectId));
        return entity;
    }

    @Override
    public void delete(String organizationId, String projectId, String entityId) {
System.out.println("CommonRepositoryImpl::delete");
System.out.flush();

        E entity = findOne(organizationId, projectId, entityId);
        mongoOperations.remove(entity, getCollectionName(organizationId, projectId));
    }

    public static String getCollectionName(String organizationId, String projectId, Class clazz) {
System.out.println("CommonRepositoryImpl::getCollectionName");
System.out.flush();

        return isEmpty(organizationId) ?
                projectId + "_" + clazz.getSimpleName() :
                organizationId + "_" + projectId + "_" + clazz.getSimpleName();
    }

    protected String getCollectionName(String organizationId, String projectId){
System.out.println("CommonRepositoryImpl::getCollectionName");
System.out.flush();

        return getCollectionName(organizationId, projectId, getEntityClass());
    }

    @Override
    public E findOne(String organizationId, String projectId, String id) {

System.out.println("CommonRepositoryImpl::findOne - getCollectionName: " + getCollectionName(organizationId, projectId));
System.out.println("CommonRepositoryImpl::findOne - getEntityClass: " + getEntityClass());
System.out.flush();
        return mongoOperations.findOne(new Query(Criteria.where("id").is(id)), getEntityClass(), getCollectionName(organizationId, projectId));
    }

    @Override
    public Collection<E> save(String organizationId, String projectId, Collection<E> entities) {
System.out.println("CommonRepositoryImpl::save");
System.out.flush();

        entities.forEach(element -> mongoOperations.save(element, getCollectionName(organizationId, projectId)));
        return entities;
    }

    @Override
    public boolean exists(String organizationId, String projectId, String id) {
        return mongoOperations.exists(new Query(Criteria.where("id").is(id)), getEntityClass(), getCollectionName(organizationId, projectId));
    }

    @Override
    public void delete(String organizationId, String projectId, Filter filter) {
        Query query = DBUtils.getQuery(getEntityClass(), filter);
        Update update = new Update().set("deleted", true);
        mongoOperations.updateMulti(query, update, getCollectionName(organizationId, projectId));
        //mongoOperations.remove(entity, getCollectionName(organizationId, projectId));
System.out.println("CommonRepositoryImpl - end of delete without entity");
System.out.flush();
    }
}
