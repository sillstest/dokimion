package com.testquack.dal.impl;

import com.testquack.beans.Project;
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
import com.testquack.dal.DokimionLogger;
import org.springframework.data.mongodb.core.query.Update;

import java.util.*;

import static org.apache.commons.lang3.StringUtils.isEmpty;

public abstract class CommonRepositoryImpl<E extends EntityPreview> implements CommonRepository<E> {

    @Autowired
    MongoOperations mongoOperations;

    public abstract Class<E> getEntityClass();

    @Override
    public List<E> find(String organizationId, String projectId, Filter filter) {
DokimionLogger.info("CommonRepositoryImpl::find - projectId: " + projectId);
DokimionLogger.info("CommonRepositoryImpl::find - filter: " + filter);

        String collName = getCollectionName(organizationId, projectId);
        DokimionLogger.info("collName - " + collName);
        DokimionLogger.info("entity class - " + getEntityClass());
        DokimionLogger.info("query - " + DBUtils.getQuery(getEntityClass(), filter));

        List<E> listEntity = mongoOperations.find(DBUtils.getQuery(getEntityClass(), filter),
                getEntityClass(),
                getCollectionName(organizationId, projectId));

        return listEntity;

/*
        return mongoOperations.find(DBUtils.getQuery(getEntityClass(), filter),
                getEntityClass(),
                getCollectionName(organizationId, projectId));
*/


    }

    @Override
    public long count(String organizationId, String projectId, Filter filter) {
DokimionLogger.info("CommonRepositoryImpl::count");

        return mongoOperations.count(DBUtils.getQuery(getEntityClass(), filter),
                getEntityClass(),
                getCollectionName(organizationId, projectId));

    }

    @Override
    public E save(String organizationId, String projectId, E entity) {
DokimionLogger.info("CommonRepositoryImpl::save - entity: " + entity);

if (entity instanceof Project) {
   Project proj = (Project)entity;
   if (proj.getReadWriteUsers() == null || proj.getReadWriteUsers().size() == 0) {
      DokimionLogger.info("CommonRepositoryImpl::save - readWriteUsers: " + proj.getReadWriteUsers());
      DokimionLogger.info("CommonRepositoryImpl::save - collectionName: " + getCollectionName(null, projectId));
      DokimionLogger.info("CommonRepositoryImpl::save - entity class: " +  getEntityClass());
   }
}
        mongoOperations.save(entity, getCollectionName(organizationId, projectId));
        return entity;
    }

    @Override
    public void delete(String organizationId, String projectId, String entityId) {
DokimionLogger.info("CommonRepositoryImpl::delete");

        E entity = findOne(organizationId, projectId, entityId);
        mongoOperations.remove(entity, getCollectionName(organizationId, projectId));
    }

    public static String getCollectionName(String organizationId, String projectId, Class clazz) {
DokimionLogger.info("CommonRepositoryImpl::getCollectionName");

        return isEmpty(organizationId) ?
                projectId + "_" + clazz.getSimpleName() :
                organizationId + "_" + projectId + "_" + clazz.getSimpleName();
    }

    protected String getCollectionName(String organizationId, String projectId){
DokimionLogger.info("CommonRepositoryImpl::getCollectionName");

        return getCollectionName(organizationId, projectId, getEntityClass());
    }

    @Override
    public E findOne(String organizationId, String projectId, String id) {

DokimionLogger.info("CommonRepositoryImpl::findOne - getCollectionName: " + getCollectionName(organizationId, projectId));
DokimionLogger.info("CommonRepositoryImpl::findOne - getEntityClass: " + getEntityClass());
        return mongoOperations.findOne(new Query(Criteria.where("id").is(id)), getEntityClass(), getCollectionName(organizationId, projectId));
    }

    @Override
    public Collection<E> save(String organizationId, String projectId, Collection<E> entities) {
DokimionLogger.info("CommonRepositoryImpl::save");

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
DokimionLogger.info("CommonRepositoryImpl - end of delete without entity");
    }
}
