(function (window, undefined) {
    L.MarkerClusterGroup = L.FeatureGroup.extend({
        options: {
            maxClusterRadius: 80,
            iconCreateFunction: null,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: true,
            zoomToBoundsOnClick: true,
            singleMarkerMode: false,
            disableClusteringAtZoom: null,
            removeOutsideVisibleBounds: true,
            animateAddingMarkers: false,
            spiderfyDistanceMultiplier: 1,
            polygonOptions: {}
        },
        initialize: function (options) {
            L.Util.setOptions(this, options);
            if (!this.options.iconCreateFunction) {
                this.options.iconCreateFunction = this._defaultIconCreateFunction;
            }
            L.FeatureGroup.prototype.initialize.call(this, []);
            this._inZoomAnimation = 0;
            this._needsClustering = [];
            this._currentShownBounds = null;
        },
        addLayer: function (layer) {
            if (layer instanceof L.LayerGroup) {
                var array = [];
                for (var i in layer._layers) {
                    if (layer._layers.hasOwnProperty(i)) {
                        array.push(layer._layers[i]);
                    }
                }
                return this.addLayers(array);
            }
            if (!this._map) {
                this._needsClustering.push(layer);
                return this;
            }
            if (this.hasLayer(layer)) {
                return this;
            }
            if (this._unspiderfy) {
                this._unspiderfy();
            }
            this._addLayer(layer, this._maxZoom);
            var visibleLayer = layer,
                currentZoom = this._map.getZoom();
            if (layer.__parent) {
                while (visibleLayer.__parent._zoom >= currentZoom) {
                    visibleLayer = visibleLayer.__parent;
                }
            }
            if (this._currentShownBounds.contains(visibleLayer.getLatLng())) {
                if (this.options.animateAddingMarkers) {
                    this._animationAddLayer(layer, visibleLayer);
                } else {
                    this._animationAddLayerNonAnimated(layer, visibleLayer);
                }
            }
            return this;
        },
        removeLayer: function (layer) {
            if (!this._map) {
                this._arraySplice(this._needsClustering, layer);
                return this;
            }
            if (!layer.__parent) {
                return this;
            }
            if (this._unspiderfy) {
                this._unspiderfy();
                this._unspiderfyLayer(layer);
            }
            this._removeLayer(layer, true);
            if (layer._icon) {
                L.FeatureGroup.prototype.removeLayer.call(this, layer);
                layer.setOpacity(1);
            }
            return this;
        },
        addLayers: function (layersArray) {
            var i, l, m;
            if (!this._map) {
                this._needsClustering = this._needsClustering.concat(layersArray);
                return this;
            }
            for (i = 0, l = layersArray.length; i < l; i++) {
                m = layersArray[i];
                if (this.hasLayer(m)) {
                    continue;
                }
                this._addLayer(m, this._maxZoom);
                if (m.__parent) {
                    if (m.__parent.getChildCount() === 2) {
                        var markers = m.__parent.getAllChildMarkers(),
                            otherMarker = markers[0] === m ? markers[1] : markers[0];
                        L.FeatureGroup.prototype.removeLayer.call(this, otherMarker);
                    }
                }
            }
            for (i in this._layers) {
                if (this._layers.hasOwnProperty(i)) {
                    m = this._layers[i];
                    if (m instanceof L.MarkerCluster && m._iconNeedsUpdate) {
                        m._updateIcon();
                    }
                }
            }
            this._topClusterLevel._recursivelyAddChildrenToMap(null, this._zoom, this._currentShownBounds);
            return this;
        },
        removeLayers: function (layersArray) {
            var i, l, m;
            if (!this._map) {
                for (i = 0, l = layersArray.length; i < l; i++) {
                    this._arraySplice(this._needsClustering, layersArray[i]);
                }
                return this;
            }
            for (i = 0, l = layersArray.length; i < l; i++) {
                m = layersArray[i];
                if (!m.__parent) {
                    continue;
                }
                this._removeLayer(m, true, true);
                if (m._icon) {
                    L.FeatureGroup.prototype.removeLayer.call(this, m);
                    m.setOpacity(1);
                }
            }
            this._topClusterLevel._recursivelyAddChildrenToMap(null, this._zoom, this._currentShownBounds);
            for (i in this._layers) {
                if (this._layers.hasOwnProperty(i)) {
                    m = this._layers[i];
                    if (m instanceof L.MarkerCluster) {
                        m._updateIcon();
                    }
                }
            }
            return this;
        },
        clearLayers: function () {
            if (!this._map) {
                this._needsClustering = [];
                delete this._gridClusters;
                delete this._gridUnclustered;
            }
            if (this._unspiderfy) {
                this._unspiderfy();
            }
            for (var i in this._layers) {
                if (this._layers.hasOwnProperty(i)) {
                    L.FeatureGroup.prototype.removeLayer.call(this, this._layers[i]);
                }
            }
            this.eachLayer(function (marker) {
                delete marker.__parent;
            });
            if (this._map) {
                this._generateInitialClusters();
            }
            return this;
        },
        getBounds: function () {
            var bounds = new L.LatLngBounds();
            if (this._topClusterLevel) {
                bounds.extend(this._topClusterLevel._bounds);
            } else {
                for (var i = this._needsClustering.length - 1; i >= 0; i--) {
                    bounds.extend(this._needsClustering[i].getLatLng());
                }
            }
            return bounds;
        },
        eachLayer: function (method, context) {
            var markers = this._needsClustering.slice(),
                i;
            if (this._topClusterLevel) {
                this._topClusterLevel.getAllChildMarkers(markers);
            }
            for (i = markers.length - 1; i >= 0; i--) {
                method.call(context, markers[i]);
            }
        },
        hasLayer: function (layer) {
            if (this._needsClustering.length > 0) {
                var anArray = this._needsClustering;
                for (var i = anArray.length - 1; i >= 0; i--) {
                    if (anArray[i] === layer) {
                        return true;
                    }
                }
            }
            return !!(layer.__parent && layer.__parent._group === this);
        },
        zoomToShowLayer: function (layer, callback) {
            var showMarker = function () {
                if ((layer._icon || layer.__parent._icon) && !this._inZoomAnimation) {
                    this._map.off('moveend', showMarker, this);
                    this.off('animationend', showMarker, this);
                    if (layer._icon) {
                        callback();
                    } else if (layer.__parent._icon) {
                        var afterSpiderfy = function () {
                            this.off('spiderfied', afterSpiderfy, this);
                            callback();
                        };
                        this.on('spiderfied', afterSpiderfy, this);
                        layer.__parent.spiderfy();
                    }
                }
            };
            if (layer._icon) {
                callback();
            } else if (layer.__parent._zoom < this._map.getZoom()) {
                this._map.on('moveend', showMarker, this);
                if (!layer._icon) {
                    this._map.panTo(layer.getLatLng());
                }
            } else {
                this._map.on('moveend', showMarker, this);
                this.on('animationend', showMarker, this);
                this._map.setView(layer.getLatLng(), layer.__parent._zoom + 1);
                layer.__parent.zoomToBounds();
            }
        },
        onAdd: function (map) {
            this._map = map;
            if (!this._gridClusters) {
                this._generateInitialClusters();
            }
            for (var i = 0, l = this._needsClustering.length; i < l; i++) {
                var layer = this._needsClustering[i];
                if (layer.__parent) {
                    continue;
                }
                this._addLayer(layer, this._maxZoom);
            }
            this._needsClustering = [];
            this._map.on('zoomend', this._zoomEnd, this);
            this._map.on('moveend', this._moveEnd, this);
            if (this._spiderfierOnAdd) {
                this._spiderfierOnAdd();
            }
            this._bindEvents();
            this._zoom = this._map.getZoom();
            this._currentShownBounds = this._getExpandedVisibleBounds();
            this._topClusterLevel._recursivelyAddChildrenToMap(null, this._zoom, this._currentShownBounds);
        },
        onRemove: function (map) {
            this._map.off('zoomend', this._zoomEnd, this);
            this._map.off('moveend', this._moveEnd, this);
            this._unbindEvents();
            this._map._mapPane.className = this._map._mapPane.className.replace(' leaflet-cluster-anim', '');
            if (this._spiderfierOnRemove) {
                this._spiderfierOnRemove();
            }
            for (var i in this._layers) {
                if (this._layers.hasOwnProperty(i)) {
                    L.FeatureGroup.prototype.removeLayer.call(this, this._layers[i]);
                }
            }
            this._map = null;
        },
        _arraySplice: function (anArray, obj) {
            for (var i = anArray.length - 1; i >= 0; i--) {
                if (anArray[i] === obj) {
                    anArray.splice(i, 1);
                    return;
                }
            }
        },
        _removeLayer: function (marker, removeFromDistanceGrid, dontUpdateMap) {
            var gridClusters = this._gridClusters,
                gridUnclustered = this._gridUnclustered,
                map = this._map;
            if (removeFromDistanceGrid) {
                for (var z = this._maxZoom; z >= 0; z--) {
                    if (!gridUnclustered[z].removeObject(marker, map.project(marker.getLatLng(), z))) {
                        break;
                    }
                }
            }
            var cluster = marker.__parent,
                markers = cluster._markers,
                otherMarker;
            this._arraySplice(markers, marker);
            while (cluster) {
                cluster._childCount--;
                if (cluster._zoom < 0) {
                    break;
                } else if (removeFromDistanceGrid && cluster._childCount <= 1) {
                    otherMarker = cluster._markers[0] === marker ? cluster._markers[1] : cluster._markers[0];
                    gridClusters[cluster._zoom].removeObject(cluster, map.project(cluster._cLatLng, cluster._zoom));
                    gridUnclustered[cluster._zoom].addObject(otherMarker, map.project(otherMarker.getLatLng(), cluster._zoom));
                    this._arraySplice(cluster.__parent._childClusters, cluster);
                    cluster.__parent._markers.push(otherMarker);
                    otherMarker.__parent = cluster.__parent;
                    if (cluster._icon) {
                        L.FeatureGroup.prototype.removeLayer.call(this, cluster);
                        if (!dontUpdateMap) {
                            L.FeatureGroup.prototype.addLayer.call(this, otherMarker);
                        }
                    }
                } else {
                    cluster._recalculateBounds();
                    if (!dontUpdateMap || !cluster._icon) {
                        cluster._updateIcon();
                    }
                }
                cluster = cluster.__parent;
            }
            delete marker.__parent;
        },
        _propagateEvent: function (e) {
            if (e.target instanceof L.MarkerCluster) {
                e.type = 'cluster' + e.type;
            }
            L.FeatureGroup.prototype._propagateEvent.call(this, e);
        },

        onAdd: function (map) {
            this._map = map;
            if (!this._gridClusters) {
                this._generateInitialClusters();
            }
            for (var i = 0, l = this._needsClustering.length; i < l; i++) {
                var layer = this._needsClustering[i];
                if (layer.__parent) {
                    continue;
                }
                this._addLayer(layer, this._maxZoom);
            }
            this._needsClustering = [];
            this._map.on('zoomend', this._zoomEnd, this);
            this._map.on('moveend', this._moveEnd, this);
            if (this._spiderfierOnAdd) {
                this._spiderfierOnAdd();
            }
            this._bindEvents();
            this._zoom = this._map.getZoom();
            this._currentShownBounds = this._getExpandedVisibleBounds();
            this._topClusterLevel._recursivelyAddChildrenToMap(null, this._zoom, this._currentShownBounds);

    }
    _animationZoomOut: function (previousZoomLevel, newZoomLevel) {
            this._animationZoomOutSingle(this._topClusterLevel, previousZoomLevel - 1, newZoomLevel);
            this._topClusterLevel._recursivelyAddChildrenToMap(null, newZoomLevel, this._getExpandedVisibleBounds());
            this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds, previousZoomLevel, this._getExpandedVisibleBounds());
}


}